// menuItems.js
import { RiContractLine, RiFile2Line, RiFolderUserLine, RiFoldersLine, RiGraduationCapLine, RiGroupLine, RiInformationLine, RiSurveyLine, RiUser2Line, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Administradores", icon: RiUserLine, path: "/[tenant]/configuracoes/gestor" },
  { title: "Avaliadores", icon: RiUser2Line, path: "/[tenant]/configuracoes/gestor/avaliadores" },

  { title: "Formulários", icon: RiSurveyLine, path: "/[tenant]/configuracoes/gestor/formularios" },
  { title: "Certificados e Declarações", icon: RiContractLine, path: "/[tenant]/configuracoes/gestor/certificados" },
  { title: "Editais", icon: RiFile2Line, path: "/[tenant]/configuracoes/gestor/editais" },
  ];

export default itensMenu;
