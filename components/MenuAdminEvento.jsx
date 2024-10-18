"use client";

import itensMenu from "@/lib/menuInscricao";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

import styles from "./MenuAdminEvento.module.scss";
import {
  RiFolderUserLine,
  RiFoldersLine,
  RiGroupLine,
  RiInformationLine,
} from "@remixicon/react";

const MenuInscricao = ({ params, onClick }) => {
  const pathname = usePathname();
  const { tenant, idInscricao } = useParams();
  const itensMenu = [
    {
      title: "Exatas e Tecnológicas",
      path: "/eventos/[eventoSlug]/admin/apresentacao/sessao/[idSessao]",
    },
    {
      title: "Saúde e Vida",
      path: "/eventos/[eventoSlug]/admin/apresentacao/sessao/[idSessao]",
    },
    //{ title: "Alunos", icon: RiGraduationCapLine, path: "/[tenant]/gestor/inscricoes/[idInscricao]/alunos" },
    {
      title: "Artes e Humanidades",
      path: "/eventos/[eventoSlug]/admin/apresentacao/sessao/[idSessao]",
    },
  ];
  return (
    <div className={styles.nav}>
      {itensMenu.map((item, i) => {
        const resolvedPath = item.path
          .replace("[eventoSlug]", params.eventoSlug)
          .replace("[idSessao]", 1);
        const isActive = pathname === resolvedPath;

        return (
          <Link
            key={i}
            href={resolvedPath}
            passHref
            className={`${styles.btn} ${isActive ? styles.selected : ""}`}
          >
            <p>{item.title}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default MenuInscricao;
