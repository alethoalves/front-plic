// menuItems.js
import { RiCouponLine, RiFile2Line, RiFileChartLine, RiFilter2Line, RiFoldersLine, RiGroupLine, RiHomeLine, RiListCheck2, RiQuestionAnswerLine, RiQuillPenLine, RiRefund2Line, RiSearch2Line, RiSettings3Line, RiSettingsLine, RiSurveyLine, RiTodoLine, RiUser2Line, RiUserLine } from "@remixicon/react";

const itensMenu = [
  { title: "Home", icon: RiHomeLine, path: "/[tenant]/gestor/[ano]" },
  { title: "Módulo de Inscrição", icon: RiCouponLine, path: "/[tenant]/gestor/[ano]/inscricoes" },
  {group:{
    title:"Módulo de Avaliação",
    icon: RiQuillPenLine,
    itens:[ 
      {title: "Convidar avaliadores", 
      path: "/[tenant]/gestor/[ano]/avaliacoes/projetos/convite"},
      {title: "Distribuir", 
        path: "/[tenant]/gestor/[ano]/avaliacoes/projetos/distribuicao"},
      {title: "Acompanhar", 
        path: "/[tenant]/gestor/[ano]/avaliacoes/projetos/acompanhamento"},
        
    ]
  }},
  {group:{
    title:"Módulo de Seleção e Classificação",
    icon: RiFilter2Line,
    itens:[ 
      {title: "Projetos e Planos", 
      path: "/[tenant]/gestor/[ano]/avaliacoes/projetos/selecao"},
      {title: "Alunos", 
        path: "/[tenant]/gestor/[ano]/participacoes/selecao/alunos"},
      {title: "Bolsas", 
        path: "/[tenant]/gestor/[ano]/bolsas/solicitacoes"},
      
      {title: "Resultado Final", 
        path: "/[tenant]/gestor/[ano]/selecao"},
      
    ]
  }},
  /** 
  {group:{
    title:"Módulo de Acompanhamento",
    icon: RiSearch2Line,
    itens:[ 
      {title: "Alunos", 
      path: "/[tenant]/gestor/[ano]/avaliacoes/projetos/selecao"},
      {title: "Atividades", 
        path: "/[tenant]/gestor/[ano]/participacoes/selecao/alunos"},
      
    ]
  }},*/
 
  

  { title: "Atividades", icon: RiListCheck2, path: "/[tenant]/gestor/[ano]/participacoes" },

  //{ title: "Bolsas", icon: RiRefund2Line, path: "/[tenant]/gestor/[ano]/bolsas" },
  //{ title: "Relatórios", icon: RiFileChartLine, path: "/[tenant]/gestor/[ano]/relatorios" },
  { title: "Configurações", icon: RiSettingsLine, path: "/[tenant]/configuracoes/gestor" },
  //{ title: "Participações", icon: RiGroupLine, path: "/[tenant]/gestor/participacoes" },
  //{ title: "Projetos", icon: RiFoldersLine, path: "/[tenant]/gestor/projetos" },
  //{ title: "Planos de Trabalho", icon: RiTodoLine, path: "/[tenant]/gestor/planosDeTrabalho" },
  //{ title: "Atividades", icon: RiListCheck2, path: "/[tenant]/gestor/atividades" },
  //{ title: "Configurações", icon: RiSettings3Line, path: "/[tenant]/gestor/configuracoes" },
];

export default itensMenu;
