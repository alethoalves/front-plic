// menuItems.js
import { RiAwardFill, RiCalendarEventFill, RiCouponLine, RiFile2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/orientador" },
  { title: "Atividades", icon: RiListCheck2, path: "/[tenant]/orientador/atividades" },
  { title: "Eventos", icon: RiCalendarEventFill, path: "/[tenant]/orientador/eventos" },
  { title: "Meus eventos", icon: RiCouponLine, path: "/[tenant]/orientador/meuseventos" },
  { title: "Certificados", icon: RiAwardFill, path: "/[tenant]/orientador/certificados" },

];

export default itensMenu;
