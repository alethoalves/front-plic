// menuItems.js
import { RiAwardFill, RiCalendarEventFill, RiCalendarFill, RiCouponLine, RiFile2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/user" },
  { title: "Atividades", icon: RiListCheck2, path: "/[tenant]/user/atividades" },
  { title: "Eventos", icon: RiCalendarEventFill, path: "/[tenant]/user/eventos" },
  { title: "Meus eventos", icon: RiCouponLine, path: "/[tenant]/user/meuseventos" },
  { title: "Certificados", icon: RiAwardFill, path: "/[tenant]/user/certificados" },

];

export default itensMenu;
