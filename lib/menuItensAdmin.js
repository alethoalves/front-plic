// menuItems.js
import { RiCalendarEventFill, RiContractLine, RiCouponLine, RiFile2Line, RiFileList3Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiPresentationFill, RiQuestionAnswerLine, RiQuillPenLine, RiSettings3Line, RiSurveyLine, RiTimeLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/evento/[tenant]/admin" },
  { title: "Avaliadores", icon: RiGroupLine, path: "/evento/[tenant]/admin/avaliadores" },
  {group:{
    title:"Módulo de Avaliação",
    icon: RiQuillPenLine,
    itens:[ 
      {title: "Distribuir", 
        path: "/evento/[tenant]/admin/distribuicao"},
      //{title: "Acompanhar", 
      //  path: "/[tenant]/gestor/[ano]/avaliacoes/projetos/acompanhamento"},
        
    ]
  }},
  { title: "Sessões", icon: RiTimeLine, path: "/evento/[tenant]/admin/sessoes" },
  { title: "Lista de Submissões", icon: RiFileList3Line, path: "/evento/[tenant]/admin/submissoes-lista" },

  
  { title: "Apresentacão", icon: RiPresentationFill, path: "/evento/[tenant]/admin/apresentacao" },
  { title: "Certificados", icon: RiContractLine, path: "/evento/[tenant]/admin/certificados" },
  { title: "Configurações", icon: RiSettings3Line, path: "/evento/[tenant]/admin/configuracoes" }


];

export default itensMenu;
