"use client";
import {
  RiCheckDoubleLine,
  RiExternalLinkLine,
  RiInformationLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getInscricao } from "@/app/api/client/inscricao";
import Table from "@/components/Table";
import { useRouter } from "next/navigation";

const Page = ({ params }) => {
  return (
    <div className={styles.navContent}>
      <h6>Olá</h6>
    </div>
  );
};

export default Page;
