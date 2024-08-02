// menuItems.js
import { RiFolderUserLine, RiFoldersLine, RiGraduationCapLine, RiGroupLine, RiInformationLine } from "@remixicon/react";

const itensMenu = [
  { title: "Dados gerais", icon: RiInformationLine, path: "/[tenant]/gestor/inscricoes/[idInscricao]" },
  { title: "Orientadores", icon: RiGroupLine, path: "/[tenant]/gestor/inscricoes/[idInscricao]/orientadores" },
  { title: "Alunos", icon: RiGraduationCapLine, path: "/[tenant]/gestor/inscricoes/[idInscricao]/alunos" },
  { title: "Planos de Trabalho", icon: RiFolderUserLine, path: "/[tenant]/gestor/inscricoes/[idInscricao]/planos" },
  { title: "Atividades", icon: RiFoldersLine, path: "/[tenant]/gestor/inscricoes/[idInscricao]/atividades" },
];

export default itensMenu;
