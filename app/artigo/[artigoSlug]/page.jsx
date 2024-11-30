import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { RiStarLine, RiUserLine } from "@remixicon/react";

const Page = () => {
  return (
    <>
      <main className={styles.main}>
        <div className={styles.bg}>
          <Image
            priority
            fill
            src={`/image/cmbTeste.webp`}
            alt="logo"
            sizes="300 500 700"
          />
        </div>
        <div className={styles.img}>
          <Image
            priority
            fill
            src={`/image/cmbTeste.webp`}
            alt="logo"
            sizes="300 500 700"
          />
        </div>

        <article>
          <header>
            <div className={styles.info}>
              <div className={styles.area}>
                <p>Botânica</p>
              </div>
              <div className={styles.actions}></div>
            </div>
            <h1 className={styles.title}>
              Diversidade de espécies arbóreas usadas na arborização do Colégio
              Militar de Brasília
            </h1>
          </header>

          <div className={styles.content}>
            <aside className={styles.asideMobile}>
              <div className={styles.card}>
                <div className={styles.award}>
                  <div className={styles.awardIcon}>
                    <RiStarLine />
                  </div>
                  <div className={styles.awardDescription}>
                    <p>
                      Este trabalho foi agraciado com{" "}
                      <strong>Menção Honrosa</strong> no 30º Congresso de
                      Iniciação Científica da UnB e 21º Congresso de Iniciação
                      Científica do DF
                    </p>
                  </div>
                </div>
              </div>
              <div className={`${styles.card} ${styles.cardAuthors}`}>
                <div className={styles.title}>
                  <p>Autores</p>
                </div>
                <div className={styles.authors}>
                  <div className={styles.slider}>
                    <div className={styles.author}>
                      <div className={styles.avatar}>
                        <RiUserLine />
                      </div>
                      <div className={styles.name}>
                        <h6>MARINA PINHEIRO ALVIENE</h6>
                        <p>Autor</p>
                      </div>
                    </div>
                    <div className={styles.author}>
                      <div className={styles.avatar}>
                        <RiUserLine />
                      </div>
                      <div className={styles.name}>
                        <h6>Gustavo Figueiredo Marques Leite</h6>
                        <p>Orientador</p>
                      </div>
                    </div>
                    <div className={styles.author}>
                      <div className={styles.avatar}>
                        <RiUserLine />
                      </div>
                      <div className={styles.name}>
                        <h6>JOSE GERALDO FELIPE DA SILVA</h6>
                        <p>Orientador</p>
                      </div>
                    </div>
                    <div className={styles.author}>
                      <div className={styles.avatar}>
                        <RiUserLine />
                      </div>
                      <div className={styles.name}>
                        <h6>PEDRO SOUZA BERBERT</h6>
                        <p>Orientador</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            <section>
              <iframe
                className="mb-2"
                width="100%"
                height="500"
                src="https://www.youtube.com/embed/9ojrb97Td30"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <p>
                O cerrado é o bioma predominante no Planalto Central brasileiro,
                contudo, são poucos os registros disponíveis sobre a
                distribuição da vegetação nativa que recobria a região que foi
                alterada para a implantação de Brasília DF, a partir de 1956,
                região esta que vem sofrendo alterações e perdendo suas
                características naturais. O presente estudo teve por objetivo
                realizar o levantamento florístico da vegetação lenhosa do
                Colégio Militar de Brasília.
              </p>
              <p>
                Para o levantamento botânico foram delimitados módulos dentro do
                colégio, de modo a facilitar na identificação de cada área
                específica. Em cada região foram nomeadas e catalogadas as
                árvores que possuíam o diâmetro acima do peito (DAP) ≥ 20 cm a
                30 cm do solo. Para avaliar a composição florística da
                vegetação, foram realizados levantamentos por meio do método de
                Censo comum e para nomenclatura botânica utilizou-se como
                referências os sistemas APG II (2009) e APG III (2016). A coleta
                de dados foi realizada por estudantes do Ensino Médio do Colégio
                Militar de Brasília (CMB), especificamente participantes do
                projeto de pesquisa em botânica, do Clube de Estudos Ambientais,
                durante o ano de 2023 e 2024.
              </p>
              <p>
                Foram identificados durante o levantamento 32 espécies,
                divididas em 15 famílias. As famílias de maior riqueza foram
                Fabaceae e Anacardiaceae. A área estudada apresentou baixa
                riqueza de espécies quando comparada com outros levantamentos
                florísticos para fragmentos florestais do bioma Cerrado. Por
                outro lado, apresentou elevada diversidade se comparada a
                regiões urbanizadas e de área amostral equivalente, tanto para o
                bioma Cerrado quanto para outros biomas. Maior parte das
                espécies registradas no CMB foram de espécies nativas do bioma
                Cerrado. Apenas 37% das espécies identificadas na área amostrada
                são exóticas, sendo a mangueira (<em>Mangifera indica</em>) a
                espécie dominante neste grupo e também da família Fabaceae o
                maior número de representantes.
              </p>
              <p>
                A escassa diversidade de espécies é característica comum ao
                processo de arborização realizado em ambientes urbanos e indica
                ausência de um planejamento adequado neste processo. Por outro
                lado, apesar da clara interferência na composição das espécies,
                a gestão e o plantio de árvores no Colégio Militar de Brasília
                (CMB) foi capaz de manter alta diversidade botânica na área do
                Colégio, tornando-o um ambiente de maior qualidade ambiental
                quando comparado a outros fragmentos de vegetação em centros
                urbanos brasileiros. A elevada frequência de espécies nativas
                sinaliza uma valorização da flora, o que, por sua vez, pode
                interferir positivamente nas atitudes dos estudantes que
                transitam nas áreas do CMB em relação à preservação e cuidados
                com a parcela de vegetação do Cerrado aí existente.
              </p>
            </section>
            <aside className={styles.asideDesktop}>
              <div className={styles.card}>
                <div className={styles.award}>
                  <div className={styles.awardIcon}>
                    <RiStarLine />
                  </div>
                  <div className={styles.awardDescription}>
                    <p>
                      Este trabalho foi agraciado com{" "}
                      <strong>Menção Honrosa</strong> no 30º Congresso de
                      Iniciação Científica da UnB e 21º Congresso de Iniciação
                      Científica do DF
                    </p>
                  </div>
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.title}>
                  <p>Autores</p>
                </div>
                <div className={styles.authors}>
                  <div className={styles.author}>
                    <div className={styles.avatar}>
                      <RiUserLine />
                    </div>
                    <div className={styles.name}>
                      <h6>MARINA PINHEIRO ALVIENE</h6>
                      <p>Autor</p>
                    </div>
                  </div>
                  <div className={styles.author}>
                    <div className={styles.avatar}>
                      <RiUserLine />
                    </div>
                    <div className={styles.name}>
                      <h6>Gustavo Figueiredo Marques Leite</h6>
                      <p>Orientador</p>
                    </div>
                  </div>
                  <div className={styles.author}>
                    <div className={styles.avatar}>
                      <RiUserLine />
                    </div>
                    <div className={styles.name}>
                      <h6>JOSE GERALDO FELIPE DA SILVA</h6>
                      <p>Orientador</p>
                    </div>
                  </div>
                  <div className={styles.author}>
                    <div className={styles.avatar}>
                      <RiUserLine />
                    </div>
                    <div className={styles.name}>
                      <h6>PEDRO SOUZA BERBERT</h6>
                      <p>Orientador</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.title}>
                  <p>Palavras-chaves</p>
                </div>
                <div className={styles.keywords}>
                  <div className={styles.keyword}>
                    <p>levantamento florístico</p>
                  </div>
                  <div className={styles.keyword}>
                    <p>arbóreas</p>
                  </div>
                  <div className={styles.keyword}>
                    <p>espécies urbanas</p>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.title}>
                  <p>Colaboradores</p>
                </div>
                <div className={styles.content}>
                  <p>
                    Marina Alviene; Gustavo Figueiredo Marques Leite; Pedro
                    Souza Berbert; José Geraldo Felipe
                  </p>
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.title}>
                  <p>Informações</p>
                </div>
                <div className={styles.content}>
                  <p>
                    Este trabalho de iniciação científica foi financiado pelo
                    CNPq.
                  </p>
                </div>
              </div>
            </aside>
            <aside className={`${styles.asideMobile} mt-2`}>
              <div className={styles.card}>
                <div className={styles.title}>
                  <p>Palavras-chaves</p>
                </div>
                <div className={styles.keywords}>
                  <div className={styles.keyword}>
                    <p>levantamento florístico</p>
                  </div>
                  <div className={styles.keyword}>
                    <p>arbóreas</p>
                  </div>
                  <div className={styles.keyword}>
                    <p>espécies urbanas</p>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.title}>
                  <p>Colaboradores</p>
                </div>
                <div className={styles.content}>
                  <p>
                    Marina Alviene; Gustavo Figueiredo Marques Leite; Pedro
                    Souza Berbert; José Geraldo Felipe
                  </p>
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.title}>
                  <p>Informações</p>
                </div>
                <div className={styles.content}>
                  <p>
                    Este trabalho de iniciação científica foi financiado pelo
                    CNPq.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>
    </>
  );
};

export default Page;
