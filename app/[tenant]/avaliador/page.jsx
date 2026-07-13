import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";
import {
  RiAwardFill,
  RiQuillPenLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiLightbulbFlashLine,
  RiArrowRightLine,
} from "@remixicon/react";

const Page = ({ params }) => {
  return (
    <main className={styles.main}>
      <div className={styles.explicacao}>
        <div className={styles.explicacaoHeader}>
          <span className={styles.explicacaoIcon}>
            <RiShieldCheckLine size={22} />
          </span>
          <div>
            <h5 className={styles.explicacaoTitulo}>
              Como funciona a avaliação de projetos
            </h5>
            <p className={styles.explicacaoSubtitulo}>
              Antes de selecionar um projeto, conheça as regras que garantem uma
              avaliação justa e ágil para todos os proponentes.
            </p>
          </div>
        </div>

        <div className={styles.comoFuncionaBox}>
          <ol className={styles.comoFuncionaLista}>
            <li>
              <strong>Um projeto por vez.</strong> Você só pode estar com um
              projeto atribuído para avaliação de cada vez. Essa regra existe
              para que nenhum avaliador acumule vários projetos e atrase o prazo
              de quem está aguardando avaliação.
            </li>
            <li>
              <strong>Quantos projetos avaliar?</strong> Esperamos que cada
              avaliador avalie entre 5 e 10 projetos. Mas se você tiver
              disponibilidade para avaliar mais, não há problema algum — pelo
              contrário, isso é muito bem-vindo e ajuda a divulgar o resultado
              final de forma mais célere para todos.
            </li>
            <li>
              <strong>Prazo de 48 horas.</strong> A partir do momento em que
              você seleciona um projeto, o esperado é que a avaliação seja
              concluída em até 48 horas. Projetos não avaliados nesse prazo
              podem retornar à fila para serem avaliados por outra pessoa.
            </li>
            <li>
              <strong>Você pode escolher outro projeto depois.</strong> Assim
              que concluir ou devolver o projeto atual, você pode selecionar
              livremente um novo projeto — quantas vezes quiser, um de cada vez.
            </li>
            <li>
              <strong>Devolução voluntária a qualquer momento.</strong> Se
              surgir um imprevisto, ou o projeto não for da sua área de atuação,
              use o botão <strong>Devolver</strong> a qualquer momento. O
              projeto volta para a fila e sua vaga é liberada para escolher
              outro.
            </li>
          </ol>
        </div>

        <div className={styles.sugestaoModo}>
          <div className={styles.sugestaoModoIcon}>
            <RiLightbulbFlashLine size={20} />
          </div>
          <div className={styles.sugestaoModoContent}>
            <h6 className={styles.sugestaoModoTitulo}>
              Uma forma prática de organizar sua avaliação
            </h6>
            <p className={styles.sugestaoModoTexto}>
              Você não precisa ficar de olho no sistema o tempo todo. Uma boa
              estratégia é entrar quando tiver um tempo livre, avaliar quantos
              projetos conseguir naquele momento, e repetir isso em outras
              oportunidades ao longo do período de avaliação.
            </p>
          </div>
        </div>

        <div className={styles.impedimentos}>
          <div className={styles.impedimentosIcon}>
            <RiAlertLine size={20} />
          </div>
          <div className={styles.impedimentosContent}>
            <h6 className={styles.impedimentosTitulo}>
              Quando um projeto não aparece para você avaliar
            </h6>
            <p className={styles.impedimentosTexto}>
              Para preservar a imparcialidade da avaliação, o sistema impede
              automaticamente que você avalie um projeto quando:
            </p>
            <ul className={styles.impedimentosListaRegras}>
              <li>
                Você participa do projeto como orientador(a), aluno(a) ou
                coorientador(a);
              </li>
              <li>
                Você possui a mesma lotação (unidade/departamento) do(a)
                orientador(a) ou coorientador(a) do projeto; ou
              </li>
              <li>
                Seu identificador Lattes consta no currículo Lattes do(a)
                orientador(a) ou coorientador(a) do projeto — por exemplo, como
                coautor(a), integrante de equipe de projeto ou participante de
                banca.
              </li>
            </ul>
            <p className={styles.impedimentosTexto}>
              Esses projetos simplesmente não aparecerão na lista de seleção.
            </p>
          </div>
        </div>
      </div>
      <div className={styles.instituicoes}>
        {/** LINK PARA AVALIAÇÃO DE PROJETOS COM OU SEM AVALIAÇÃO DE PLANOS DE TRABALHO **/}
        {/** edital tem formulário de avaliação de projeto **/}
        {/** a avaliação do plano dependerá se o edital possui formulário de avaliação de plano **/}
        <Button
          linkTo={`/${params.tenant}/avaliador/avaliacoes/projetos`}
          className="btn-primary mb-4"
          icon={RiArrowRightLine}
        >
          Ir para a sala de avaliação
        </Button>
        {/** LINK PARA AVALIAÇÃO APENAS DE PLANOS DE TRABALHO **/}
        {/** quando o edital prevê apenas formulário de avaliação do plano **/}
        {false && (
          <Link href={`/avaliador/avaliacoes/planos`}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiQuillPenLine />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliar Planos de Trabalho</h6>
              </div>
            </div>
          </Link>
        )}
        {/** LINK PARA AVALIAÇÃO DE ATIVIDADES **/}
        {false && (
          <Link href={`${params.tenant}/avaliador/avaliacoes/atividades`}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiQuillPenLine />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliar atividades</h6>
              </div>
            </div>
          </Link>
        )}
        {false && (
          <Link href={"/avaliador/home/certificados"}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiAwardFill />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliações concluídas</h6>
              </div>
            </div>
          </Link>
        )}
        {false && (
          <Link href={"/avaliador/home/certificados"}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiAwardFill />
              </div>
              <div className={styles.descricao}>
                <h6>Declarações e Certificados</h6>
              </div>
            </div>
          </Link>
        )}
      </div>
    </main>
  );
};

export default Page;
