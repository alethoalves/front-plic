import ComprovanteInscricao from "@/components/ComprovanteInscricao";

const Page = ({ params }) => (
  <ComprovanteInscricao tenant={params.tenant} idInscricao={params.idInscricao} />
);

export default Page;
