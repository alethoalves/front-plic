// menuItems.js
import { RiBarChartLine, RiContractLine, RiFile2Line, RiFileList3Line, RiFolderUserLine, RiFoldersLine, RiGraduationCapLine, RiGroupLine, RiInformationLine, RiSurveyLine, RiUser2Line, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Administradores", icon: RiUserLine, path: "/[tenant]/configuracoes/gestor" },
  { title: "Avaliadores", icon: RiUser2Line, path: "/[tenant]/configuracoes/gestor/avaliadores" },

  { title: "Formulários", icon: RiSurveyLine, path: "/[tenant]/configuracoes/gestor/formularios" },
  { title: "Fichas de Avaliação", icon: RiFileList3Line, path: "/[tenant]/configuracoes/gestor/fichas-avaliacao" },
  { title: "Certificados e Declarações", icon: RiContractLine, path: "/[tenant]/configuracoes/gestor/certificados" },
  { title: "Editais", icon: RiFile2Line, path: "/[tenant]/configuracoes/gestor/editais" },
  { title: "Relatórios", icon: RiBarChartLine, path: "/[tenant]/configuracoes/gestor/relatorios" },
  ];

export default itensMenu;
