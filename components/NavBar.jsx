"use client";
import {
  RiAddCircleLine,
  RiEditLine,
  RiLogoutBoxRLine,
  RiSettingsLine,
} from "@remixicon/react";
import styles from "./NavBar.module.scss";
import { logout } from "@/app/api/client/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TieredMenu } from "primereact/tieredmenu";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import FormEdital from "./Formularios/FormEdital";
import Modal from "./Modal";
import { getEditais } from "@/app/api/client/edital";
import { setCookie } from "cookies-next"; // Importe do cookies-next
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";

const SideNav = ({ slug, anoSelected, menuType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anos, setAnos] = useState([]);

  const router = useRouter();
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const editaisTenant = await getEditais(slug);

        // Extrair anos únicos dos editais
        const anosUnicos = [
          ...new Set(editaisTenant.map((edital) => edital.ano)),
        ].sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo

        setAnos(anosUnicos); // Definir os anos únicos
        setEditais(editaisTenant); // Definir os editais
      } catch (error) {
        console.error("Erro ao buscar :", error);
        setError("Erro ao buscar .");
      }
    };
    fetchData();
  }, [slug]);

  const handleLogout = () => {
    logout();
    router.replace(`/${slug}`);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
  };

  const openModalAndSetData = () => {
    setIsModalOpen(true);
  };

  // Criar array de anos com links
  const anosMenuItems = anos.map((ano) => ({
    label: ano.toString(),
    command: () => {
      // Atualiza o cookie com o novo ano selecionado
      setCookie("anoSelected", ano, {
        maxAge: 60 * 60 * 24 * 365, // 1 ano em segundos
        path: "/", // Disponível em todas as rotas
      });
      // Navega para a nova rota
      router.push(`/${slug}/gestor/${ano}`);
    },
  }));

  const items = [
    {
      label: "Selecione outro ano",
      items: anosMenuItems,
    },
  ];

  const renderModalContent = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModalAndResetData}
      showIconClose={editais.length > 0 ? true : false}
    >
      <h4>Crie um edital</h4>
      {!editais.length > 0 && (
        <p>Para usar a plataforma é necessário criar um edital</p>
      )}
      <FormEdital
        tenantSlug={slug}
        onClose={closeModalAndResetData}
        onSuccess={(edital) => {
          // Salva o cookie 'anoSelected' com o ano do edital (validade: 1 ano)
          setCookie("anoSelected", edital.ano, {
            maxAge: 60 * 60 * 24 * 365, // 1 ano em segundos
            path: "/", // Disponível em todas as rotas
          });
          // Redireciona para a página do gestor
          router.push(`/${slug}/gestor/${edital.ano}`);
        }}
      />
    </Modal>
  );

  const menuLeft = useRef(null);

  return (
    <>
      {renderModalContent()}
      <div className={styles.navBar}>
        <div className={styles.navBarItem1}>
          {menuType === "gestor" && anoSelected && (
            <>
              <h6 className={styles.anoSelecionado}>Ano selecionado</h6>
              <Menu model={items} popup ref={menuLeft} id="popup_menu_left" />
              <Button
                label={anoSelected}
                icon="pi pi-angle-down"
                className="mr-2"
                onClick={(event) => menuLeft.current.toggle(event)}
                aria-controls="popup_menu_left"
                aria-haspopup
              />
            </>
          )}
        </div>
        <div className={styles.navBarItem2}>
          {menuType === "gestor" && (
            <div className={styles.navBarGestor}>
              <div className={styles.btnEdital} onClick={openModalAndSetData}>
                <RiAddCircleLine />
                <p>Novo edital</p>
              </div>
            </div>
          )}
        </div>
        <div className={styles.navBarItem3}>
          <div className={styles.notifications}></div>

          <div className={styles.logout} onClick={handleLogout}>
            <p>Sair</p>
            <RiLogoutBoxRLine />
          </div>
        </div>
      </div>
    </>
  );
};

export default SideNav;
