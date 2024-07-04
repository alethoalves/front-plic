// menuItems.js
import { RiCouponLine, RiFile2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/gestor" },
  { title: "Administradores", icon: RiUserLine, path: "/[tenant]/gestor/perfis" },
  { title: "Formulários", icon: RiSurveyLine, path: "/[tenant]/gestor/formularios" },
  { title: "Editais", icon: RiFile2Line, path: "/[tenant]/gestor/editais" },
  { title: "Inscrições", icon: RiCouponLine, path: "/[tenant]/gestor/inscricoes" },
  { title: "Participações", icon: RiGroupLine, path: "/[tenant]/gestor/participacoes" },
  { title: "Projetos", icon: RiFoldersLine, path: "/[tenant]/gestor/projetos" },
  { title: "Planos de Trabalho", icon: RiTodoLine, path: "/[tenant]/gestor/planosDeTrabalho" },
  { title: "Atividades", icon: RiListCheck2, path: "/[tenant]/gestor/atividades" },
  { title: "Configurações", icon: RiSettings3Line, path: "/[tenant]/gestor/configuracoes" },
];

export default itensMenu;
