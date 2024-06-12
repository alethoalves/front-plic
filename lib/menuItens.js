// menuItems.js
import { RiFile2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/gestor" },
  { title: "Administradores", icon: RiUserLine, path: "/gestor/perfis" },
  { title: "Formulários", icon: RiSurveyLine, path: "/gestor/formularios" },
  { title: "Editais", icon: RiFile2Line, path: "/gestor/editais" },
  { title: "Participações", icon: RiGroupLine, path: "/gestor/participacoes" },
  { title: "Projetos", icon: RiFoldersLine, path: "/gestor/projetos" },
  { title: "Planos de Trabalho", icon: RiTodoLine, path: "/gestor/planosDeTrabalho" },
  { title: "Atividades", icon: RiListCheck2, path: "/gestor/atividades" },
  { title: "Configurações", icon: RiSettings3Line, path: "/gestor/configuracoes" },
];

export default itensMenu;
