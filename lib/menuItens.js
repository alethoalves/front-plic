// menuItems.js
import { RiCouponLine, RiFile2Line, RiFileChartLine, RiFilter2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiQuillPenLine, RiRefund2Line, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUser2Line, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/gestor" },
  { title: "Administradores", icon: RiUserLine, path: "/[tenant]/gestor/perfis" },
  { title: "Avaliadores", icon: RiUser2Line, path: "/[tenant]/gestor/avaliadores" },

  { title: "Formulários", icon: RiSurveyLine, path: "/[tenant]/gestor/formularios" },
  
  { title: "Editais", icon: RiFile2Line, path: "/[tenant]/gestor/editais" },

  { title: "Inscrições", icon: RiCouponLine, path: "/[tenant]/gestor/planos" },
  { title: "Avaliações", icon: RiQuillPenLine, path: "/[tenant]/gestor/avaliacoes" },

  { title: "Bolsas", icon: RiRefund2Line, path: "/[tenant]/gestor/bolsas" },
  { title: "Relatórios", icon: RiFileChartLine, path: "/[tenant]/gestor/relatorios" },
  //{ title: "Participações", icon: RiGroupLine, path: "/[tenant]/gestor/participacoes" },
  //{ title: "Projetos", icon: RiFoldersLine, path: "/[tenant]/gestor/projetos" },
  //{ title: "Planos de Trabalho", icon: RiTodoLine, path: "/[tenant]/gestor/planosDeTrabalho" },
  //{ title: "Atividades", icon: RiListCheck2, path: "/[tenant]/gestor/atividades" },
  //{ title: "Configurações", icon: RiSettings3Line, path: "/[tenant]/gestor/configuracoes" },
];

export default itensMenu;
