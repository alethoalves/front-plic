"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

import styles from "./Menu.module.scss";
import { useEffect, useState } from "react";
import { getEditais } from "@/app/api/client/edital";
import { getSessoesBySlug } from "@/app/api/client/sessoes";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import { getCookie, setCookie } from "cookies-next";

const filterByPerfil = (items, perfil) =>
  items.filter((item) => !item.requiredPerfil || item.requiredPerfil === perfil);

const Menu = ({ onClick, itensMenu, existeEdital, gestor = false }) => {
  const pathname = usePathname();
  const { tenant, eventoSlug, edicao } = useParams();
  const [ano, setAno] = useState(null);
  const [filteredMenu, setFilteredMenu] = useState(itensMenu);
  // Sub-itens de grupos "dinâmicos" (ex.: uma subsessão por item, sob o
  // grupo "Sessões" do admin) — buscados aqui em vez de virem estáticos de
  // lib/menuItens*.js, já que variam por evento. Guardado por chave
  // (group.dynamicItens) pra suportar mais de um grupo dinâmico no futuro.
  const [itensDinamicos, setItensDinamicos] = useState({});

  useEffect(() => {
    const perfil = getCookie("perfilSelecionado") ?? null;
    setFilteredMenu(filterByPerfil(itensMenu, perfil));
  }, [itensMenu]);

  useEffect(() => {
    const chaves = itensMenu
      .filter((item) => item.group?.dynamicItens)
      .map((item) => item.group.dynamicItens);

    if (!chaves.includes("subsessoesAdmin") || !eventoSlug) return;

    let ativo = true;
    getSessoesBySlug(eventoSlug)
      .then((sessoes) => {
        if (!ativo) return;
        const itens = (sessoes || []).flatMap((sessao) =>
          [...(sessao.subsessaoApresentacao || [])]
            .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
            .map((sub) => ({
              title: `${sessao.titulo} — ${formatarData(
                sub.inicio
              )} ${formatarHora(sub.inicio)}`,
              path: `/evento/[tenant]/admin/sessoes/${sub.id}`,
            }))
        );
        setItensDinamicos((prev) => ({ ...prev, subsessoesAdmin: itens }));
      })
      .catch((error) => {
        console.error("Erro ao buscar subsessões pro menu:", error);
      });

    return () => {
      ativo = false;
    };
  }, [itensMenu, eventoSlug]);

  useEffect(() => {
    if (gestor) {
      const fetchData = async () => {
        const anoSelected = getCookie("anoSelected");
        const editaisData = await getEditais(tenant);

        if (editaisData.length > 0) {
          const anoValidado = editaisData.some(
            (edital) => edital.ano === parseInt(anoSelected)
          );

          let finalAno;
          if (anoValidado) {
            finalAno = anoSelected;
          } else {
            const editaisOrdenados = [...editaisData].sort(
              (a, b) => b.ano - a.ano
            );
            finalAno = editaisOrdenados[0].ano;
            setCookie("anoSelected", finalAno, {
              maxAge: 60 * 60 * 24 * 365,
            });
          }
          setAno(finalAno);
        }
      };

      fetchData();
    }
  }, [gestor, tenant]);

  const renderMenuItem = (item, i, isGroupItem = false) => {
    const Icon = item.icon;
    const resolvedPath = item.path
      ?.replace("[tenant]", tenant || eventoSlug)
      ?.replace("[ano]", ano)
      ?.replace("[edicao]", edicao);

    // Verificação específica para a rota "Home"
    const isActive =
      i === 0 && !isGroupItem
        ? pathname === resolvedPath
        : resolvedPath &&
          pathname.startsWith(resolvedPath) &&
          pathname !== `/${tenant}/gestor/${ano}`;

    if (!item.path) return null;

    return (
      <Link key={i} href={resolvedPath} onClick={onClick} passHref>
        <li
          className={`${isActive ? styles.active : ""} ${
            isGroupItem ? styles.groupItem : ""
          } ${item.highlight ? styles.highlight : ""}`}
        >
          <div className={styles.icon}>{Icon && <Icon />}</div>
          <p>{item.title}</p>
        </li>
      </Link>
    );
  };

  const renderGroup = (group, groupIndex) => {
    const itens = group.dynamicItens
      ? itensDinamicos[group.dynamicItens] || []
      : group.itens;

    return (
      <div key={groupIndex} className={styles.group}>
        <div className={styles.groupTitle}>
          <div className={styles.icon}>{group.icon && <group.icon />}</div>
          <p>{group.title}</p>
        </div>
        <ul className={styles.groupItems}>
          {itens.map((item, i) => renderMenuItem(item, i))}
        </ul>
      </div>
    );
  };

  return (
    <ul className={styles.menu}>
      {filteredMenu.map((item, i) => {
        if (item.group) {
          return renderGroup(item.group, i);
        }
        return renderMenuItem(item, i);
      })}
    </ul>
  );
};

export default Menu;
