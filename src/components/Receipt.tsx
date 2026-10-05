"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { site } from "@/lib/site";

/** Print button: the browser's print dialog also offers "Save as PDF". */
export function ReceiptActions({ back, backLabel, printLabel }: { back: string; backLabel: string; printLabel: string }) {
  return (
    <div className="receipt-actions">
      <Link href={back} className="back-link">
        {backLabel}
      </Link>
      <button type="button" className="tfs-btn tfs-btn--primary" onClick={() => window.print()}>
        <Icon name="file-text" size={18} />
        {printLabel}
      </button>
    </div>
  );
}

/** The printable sheet: company details on top, then the document. */
export function ReceiptSheet({ title, kvkLabel, children }: { title: string; kvkLabel: string; children: ReactNode }) {
  return (
    <article className="receipt">
      <header className="receipt__head">
        <div>
          <p className="receipt__brand">{site.name}</p>
          <p className="receipt__company">
            {site.legalName}
            <br />
            {site.address.street}, {site.address.postcode} {site.address.city}
            <br />
            {site.address.country}
            <br />
            <span dir="ltr">{site.email}</span> · <span dir="ltr">{site.phone}</span>
            <br />
            {kvkLabel}: {site.kvk}
          </p>
        </div>
        <h1 className="receipt__title">{title}</h1>
      </header>
      {children}
    </article>
  );
}
