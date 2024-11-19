// menuItems.js
import { RiAwardFill, RiCalendarEventFill, RiCalendarFill, RiCouponLine, RiFile2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiSettings3Line, RiSurveyLine, RiTodoLine, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/aluno" },
  { title: "Atividades", icon: RiListCheck2, path: "/[tenant]/aluno/atividades" },
  { title: "Eventos", icon: RiCalendarEventFill, path: "/[tenant]/aluno/eventos" },
  { title: "Meus eventos", icon: RiCouponLine, path: "/[tenant]/aluno/meuseventos" },
  { title: "Certificados", icon: RiAwardFill, path: "/[tenant]/aluno/certificados" },

];

export default itensMenu;
