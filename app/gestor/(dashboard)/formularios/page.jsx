import Buscador from "@/components/Buscador";
import Header from "@/components/Header";

const Page = () => {
  return (
  <main>
    <Header 
    className="mb-3"
    titulo="Formulários"
    subtitulo="Edite e crie os formulários da sua instituição"
    descricao="Aqui você gerencia os formulários usados nas diversas etapas da iniciação científica."
    />
    <Buscador/>
  </main>
  );
}

export default Page;