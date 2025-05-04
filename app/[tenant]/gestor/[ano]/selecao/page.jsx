"use client";
import React, { useEffect, useRef, useState } from "react";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import styles from "./page.module.scss";
import Resultado from "@/components/Resultado";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useRef(null);

  return (
    <main>
      <>
        <Card>
          <Resultado />
        </Card>
      </>
    </main>
  );
};

export default Page;
