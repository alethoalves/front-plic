"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./ClientSelect.module.scss";

const ClientSelect = ({ tenants }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (tenant) => {
    setSelectedTenant(tenant);
    setIsOpen(false);
  };

  if (!tenants || tenants.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyLogo}>
          <Image
            fill
            src="/image/noData.svg"
            alt="Nenhuma instituição encontrada"
            sizes="200"
          />
        </div>
        <p>Nenhuma instituição disponível</p>
      </div>
    );
  }

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={`${styles.dropdownTrigger} ${isOpen ? styles.open : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.triggerText}>
          {selectedTenant ? (
            <>
              <span className={styles.selectedLogo}>
                <Image
                  src={`/image/${selectedTenant.pathLogo}`}
                  alt={selectedTenant.name || "Instituição"}
                  fill
                  sizes="24"
                />
              </span>
              <span>{selectedTenant.name || "Selecione uma instituição"}</span>
            </>
          ) : (
            "Escolha uma instituição"
          )}
        </span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu}>
          {tenants.map((tenant) => (
            <li key={tenant.id}>
              <Link
                href={`/${tenant.slug}`}
                className={styles.dropdownItem}
                onClick={() => handleSelect(tenant)}
              >
                <span className={styles.itemLogo}>
                  <Image
                    src={`/image/${tenant.pathLogo}`}
                    alt={tenant.name || "Logo"}
                    fill
                    sizes="32"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientSelect;
