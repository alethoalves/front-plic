import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

const Page = () => {
  return (
    <>
      <main className={styles.main}>
        <article>
          <header>
            <h1>
              Diversidade de espécies arbóreas usadas na arborização do Colégio
              Militar de Brasília
            </h1>
            <p>
              <strong>Alunos:</strong> MARINA PINHEIRO ALVIENE
            </p>
            <p>
              <strong>Orientadores/Coorientadores:</strong> PEDRO SOUZA BERBERT
              (orientador), JOSE GERALDO FELIPE DA SILVA (orientador), Gustavo
              Figueiredo Marques Leite (coorientador)
            </p>
            <p>
              <strong>Área:</strong> Botânica
            </p>
            <p>
              <strong>Edital:</strong> PIBIC EM
            </p>
            <p>
              <strong>Instituição:</strong> CMB
            </p>
          </header>

          <section id="introducao">
            <h2>Introdução</h2>
            <p>
              O cerrado é o bioma predominante no Planalto Central brasileiro,
              contudo, são poucos os registros disponíveis sobre a distribuição
              da vegetação nativa que recobria a região que foi alterada para a
              implantação de Brasília DF, a partir de 1956, região esta que vem
              sofrendo alterações e perdendo suas características naturais. O
              presente estudo teve por objetivo realizar o levantamento
              florístico da vegetação lenhosa do Colégio Militar de Brasília.
            </p>
          </section>

          <section id="metodologia">
            <h2>Metodologia</h2>
            <p>
              Para o levantamento botânico foram delimitados módulos dentro do
              colégio, de modo a facilitar na identificação de cada área
              específica. Em cada região foram nomeadas e catalogadas as árvores
              que possuíam o diâmetro acima do peito (DAP) ≥ 20 cm a 30 cm do
              solo. Para avaliar a composição florística da vegetação, foram
              realizados levantamentos por meio do método de Censo comum e para
              nomenclatura botânica utilizou-se como referências os sistemas APG
              II (2009) e APG III (2016). A coleta de dados foi realizada por
              estudantes do Ensino Médio do Colégio Militar de Brasília (CMB),
              especificamente participantes do projeto de pesquisa em botânica,
              do Clube de Estudos Ambientais, durante o ano de 2023 e 2024.
            </p>
          </section>

          <section id="resultados">
            <h2>Resultados</h2>
            <p>
              Foram identificados durante o levantamento 32 espécies, divididas
              em 15 famílias. As famílias de maior riqueza foram Fabaceae e
              Anacardiaceae. A área estudada apresentou baixa riqueza de
              espécies quando comparada com outros levantamentos florísticos
              para fragmentos florestais do bioma Cerrado. Por outro lado,
              apresentou elevada diversidade se comparada a regiões urbanizadas
              e de área amostral equivalente, tanto para o bioma Cerrado quanto
              para outros biomas. Maior parte das espécies registradas no CMB
              foram de espécies nativas do bioma Cerrado. Apenas 37% das
              espécies identificadas na área amostrada são exóticas, sendo a
              mangueira (<em>Mangifera indica</em>) a espécie dominante neste
              grupo e também da família Fabaceae o maior número de
              representantes.
            </p>
          </section>

          <section id="conclusao">
            <h2>Conclusão</h2>
            <p>
              A escassa diversidade de espécies é característica comum ao
              processo de arborização realizado em ambientes urbanos e indica
              ausência de um planejamento adequado neste processo. Por outro
              lado, apesar da clara interferência na composição das espécies, a
              gestão e o plantio de árvores no Colégio Militar de Brasília (CMB)
              foi capaz de manter alta diversidade botânica na área do Colégio,
              tornando-o um ambiente de maior qualidade ambiental quando
              comparado a outros fragmentos de vegetação em centros urbanos
              brasileiros. A elevada frequência de espécies nativas sinaliza uma
              valorização da flora, o que, por sua vez, pode interferir
              positivamente nas atitudes dos estudantes que transitam nas áreas
              do CMB em relação à preservação e cuidados com a parcela de
              vegetação do Cerrado aí existente.
            </p>
          </section>

          <footer>
            <section id="palavras-chave">
              <h3>Palavras-chave</h3>
              <p>levantamento florístico, arbóreas, espécies urbanas</p>
            </section>

            <section id="colaboradores">
              <h3>Colaboradores</h3>
              <p>
                Marina Alviene; Gustavo Figueiredo Marques Leite; Pedro Souza
                Berbert; José Geraldo Felipe
              </p>
            </section>
          </footer>
        </article>
      </main>
    </>
  );
};

export default Page;
