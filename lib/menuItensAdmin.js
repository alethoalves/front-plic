// menuItems.js
import { RiCalendarEventFill, RiCouponLine, RiFile2Line, RiFileList3Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTimeLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/evento/[tenant]/admin" },
  { title: "Avaliadores", icon: RiGroupLine, path: "/evento/[tenant]/admin/avaliadores" },
  { title: "Submissão", icon: RiFileList3Line, path: "/evento/[tenant]/admin/submissao" },
  // Sub-itens buscados em tempo real (Menu.jsx) — uma subsessão por item,
  // já que a gestão de sessões/subsessões migrou pra Configurações > Sessões.
  {group:{
    title:"Sessões",
    icon: RiTimeLine,
    dynamicItens: "subsessoesAdmin"
  }},
  { title: "Configurações", icon: RiSettings3Line, path: "/evento/[tenant]/admin/configuracoes" }


];

export default itensMenu;
