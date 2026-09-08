"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCookie } from "cookies-next";
import styles from "./page.module.scss";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { Notification } from "@/components/Notification";
import Avatar from "@/components/Avatar";
import { getCurrentUserId } from "@/lib/headers";
import { getMe, updateMe } from "@/app/api/client/user";
import {
  getUserTenantsByUser,
  getOpcoesAluno,
  getOpcoesLotacao,
  upsertUserTenantLotacao,
  upsertUserTenantCargo,
  upsertUserTenantCurso,
} from "@/app/api/client/userTenant";

const dadosPessoaisSchema = z.object({
  nome: z.string().trim().min(1, { message: "Nome é obrigatório!" }),
  email: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z
      .string()
      .trim()
      .email({ message: "Informe um email válido!" })
      .optional(),
  ),
});

const VinculoAnoForm = ({
  tenant,
  userId,
  ano,
  userTenant,
  isOrientador,
  isAluno,
  opcoesCargo,
  opcoesCurso,
  opcoesLotacao,
  onSaved,
}) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      lotacaoId: userTenant?.lotacaoId ? String(userTenant.lotacaoId) : "",
      cargoId: userTenant?.cargoId ? String(userTenant.cargoId) : "",
      cursoId: userTenant?.cursoId ? String(userTenant.cursoId) : "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (isOrientador && (!data.lotacaoId || !data.cargoId)) {
      setMessage({ type: "error", text: "Selecione a lotação e o cargo." });
      setLoading(false);
      return;
    }
    if (isAluno && !data.cursoId) {
      setMessage({ type: "error", text: "Selecione o curso." });
      setLoading(false);
      return;
    }

    try {
      const promises = [];
      if (isOrientador) {
        promises.push(
          upsertUserTenantLotacao(tenant, userId, ano, data.lotacaoId),
        );
        promises.push(
          upsertUserTenantCargo(tenant, userId, ano, data.cargoId),
        );
      }
      if (isAluno) {
        promises.push(upsertUserTenantCurso(tenant, userId, ano, data.cursoId));
      }
      const results = await Promise.all(promises);
      const merged = results.reduce((acc, ut) => ({ ...acc, ...ut }), { ano });
      onSaved?.(merged);
      setMessage({ type: "success", text: "Dados salvos com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar vínculo do ano:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message ?? "Erro ao salvar os dados.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {isOrientador && (
        <>
          <div className={styles.input}>
            <Select
              control={control}
              name="lotacaoId"
              label="Lotação"
              options={opcoesLotacao}
              placeholder="Selecione sua lotação"
            />
          </div>
          <div className={styles.input}>
            <Select
              control={control}
              name="cargoId"
              label="Cargo"
              options={opcoesCargo}
              placeholder="Selecione seu cargo"
            />
          </div>
        </>
      )}
      {isAluno && (
        <div className={styles.input}>
          <Select
            control={control}
            name="cursoId"
            label="Curso"
            options={opcoesCurso}
            placeholder="Selecione seu curso"
          />
        </div>
      )}
      {message.type === "success" && (
        <p className={styles.statusSucesso}>{message.text}</p>
      )}
      {message.type === "error" && (
        <Notification className="notification-error">
          {message.text}
        </Notification>
      )}
      <Button className="btn-primary mt-2" type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
};

const Page = ({ params }) => {
  const userId = useMemo(() => getCurrentUserId(), []);
  const [isOrientador, setIsOrientador] = useState(false);
  const [isAluno, setIsAluno] = useState(false);
  const [nomeAtual, setNomeAtual] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingDados, setSavingDados] = useState(false);
  const [dadosMsg, setDadosMsg] = useState({ type: "", text: "" });

  const [userTenants, setUserTenants] = useState([]);
  const [opcoesCargo, setOpcoesCargo] = useState([]);
  const [opcoesCurso, setOpcoesCurso] = useState([]);
  const [opcoesLotacao, setOpcoesLotacao] = useState([]);
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [anoAtivo, setAnoAtivo] = useState(null);

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(dadosPessoaisSchema),
    defaultValues: { nome: "", email: "" },
  });

  // Papel do usuário no tenant (orientador/aluno) vem do cookie userProfiles
  // (array completo de papéis, setado no login) — não existe campo direto
  // em UserTenant para isso.
  useEffect(() => {
    let papeis = [];
    try {
      const cookie = getCookie("userProfiles");
      const userProfiles = cookie ? JSON.parse(cookie) : [];
      papeis = userProfiles
        .filter((p) => p.tenant === params.tenant)
        .map((p) => p.cargo);
    } catch {
      papeis = [];
    }
    setIsOrientador(papeis.includes("orientador"));
    setIsAluno(papeis.includes("aluno"));
  }, [params.tenant]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const user = await getMe(params.tenant);
        if (user) {
          setNomeAtual(user.nome || "");
          reset({ nome: user.nome || "", email: user.email || "" });
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [params.tenant, reset]);

  useEffect(() => {
    if (!(isOrientador || isAluno) || !userId) return;
    const fetchVinculos = async () => {
      setLoadingVinculos(true);
      try {
        const [tenants, opcoesAluno] = await Promise.all([
          getUserTenantsByUser(params.tenant, userId),
          getOpcoesAluno(params.tenant),
        ]);
        setUserTenants(tenants || []);
        setOpcoesCargo(opcoesAluno?.cargos || []);
        setOpcoesCurso(opcoesAluno?.cursos || []);
        if (isOrientador) {
          const lotacoes = await getOpcoesLotacao(params.tenant);
          setOpcoesLotacao(lotacoes || []);
        }
        setAnoAtivo(tenants?.[0]?.ano ?? new Date().getFullYear());
      } catch (error) {
        console.error("Erro ao carregar vínculos do usuário:", error);
      } finally {
        setLoadingVinculos(false);
      }
    };
    fetchVinculos();
  }, [params.tenant, userId, isOrientador, isAluno]);

  const onSubmitDados = async (data) => {
    setSavingDados(true);
    setDadosMsg({ type: "", text: "" });
    try {
      const payload = { nome: data.nome };
      if (data.email) payload.email = data.email;
      const updated = await updateMe(params.tenant, payload);
      setNomeAtual(updated?.nome || data.nome);
      setDadosMsg({ type: "success", text: "Dados atualizados com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar dados pessoais:", error);
      setDadosMsg({
        type: "error",
        text: error.response?.data?.message ?? "Erro ao salvar os dados.",
      });
    } finally {
      setSavingDados(false);
    }
  };

  const handleVinculoSaved = (userTenantAtualizado) => {
    setUserTenants((prev) => {
      const existe = prev.some((ut) => ut.ano === userTenantAtualizado.ano);
      if (existe) {
        return prev.map((ut) =>
          ut.ano === userTenantAtualizado.ano
            ? { ...ut, ...userTenantAtualizado }
            : ut,
        );
      }
      return [...prev, userTenantAtualizado].sort((a, b) => b.ano - a.ano);
    });
  };

  // Usuário com papel no tenant mas ainda sem nenhum UserTenant: mostra uma
  // aba sintética do ano atual — o primeiro "Salvar" cria o registro.
  const abas =
    userTenants.length > 0
      ? userTenants.map((ut) => ut.ano)
      : isOrientador || isAluno
        ? [new Date().getFullYear()]
        : [];

  const userTenantAtivo =
    userTenants.find((ut) => ut.ano === anoAtivo) || null;

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <Avatar nome={nomeAtual} size={56} />
        <h4>Meu perfil</h4>
      </div>

      <div className={styles.secao}>
        <div className={styles.secaoHead}>
          <h6>Dados pessoais</h6>
        </div>
        <div className={styles.secaoContent}>
          {loadingUser ? (
            <p>Carregando...</p>
          ) : (
            <form
              className={styles.formulario}
              onSubmit={handleSubmit(onSubmitDados)}
            >
              <div className={styles.input}>
                <Input
                  control={control}
                  name="nome"
                  label="Nome completo"
                  inputType="text"
                  placeholder="Digite seu nome completo"
                  disabled={savingDados}
                />
              </div>
              <div className={styles.input}>
                <Input
                  control={control}
                  name="email"
                  label="Email"
                  inputType="email"
                  placeholder="Digite seu email"
                  disabled={savingDados}
                />
              </div>
              {dadosMsg.type === "success" && (
                <p className={styles.statusSucesso}>{dadosMsg.text}</p>
              )}
              {dadosMsg.type === "error" && (
                <Notification className="notification-error">
                  {dadosMsg.text}
                </Notification>
              )}
              <Button
                className="btn-primary mt-2"
                type="submit"
                disabled={savingDados}
              >
                {savingDados ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          )}
        </div>
      </div>

      {(isOrientador || isAluno) && (
        <div className={styles.secao}>
          <div className={styles.secaoHead}>
            <h6>Vínculos por ano</h6>
          </div>
          <div className={styles.secaoContent}>
            {loadingVinculos ? (
              <p>Carregando...</p>
            ) : abas.length === 0 ? (
              <p>Nenhum vínculo encontrado.</p>
            ) : (
              <>
                <div className={styles.abas}>
                  {abas.map((ano) => (
                    <button
                      key={ano}
                      type="button"
                      className={`${styles.aba} ${
                        anoAtivo === ano ? styles.abaAtiva : ""
                      }`}
                      onClick={() => setAnoAtivo(ano)}
                    >
                      {ano}
                    </button>
                  ))}
                </div>
                <VinculoAnoForm
                  key={anoAtivo}
                  tenant={params.tenant}
                  userId={userId}
                  ano={anoAtivo}
                  userTenant={userTenantAtivo}
                  isOrientador={isOrientador}
                  isAluno={isAluno}
                  opcoesCargo={opcoesCargo}
                  opcoesCurso={opcoesCurso}
                  opcoesLotacao={opcoesLotacao}
                  onSaved={handleVinculoSaved}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
