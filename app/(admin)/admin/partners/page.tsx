"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/global/admin/data-table";
import { partnerColumns } from "@/components/global/admin/columns";
import Title from "@/components/global/title";
import { useAppContext } from "@/lib/context";
import { useRouter, useSearchParams } from "next/navigation";

export default function PartnersPage() {
  const { partners, qaPartners } = useAppContext();
  const router = useRouter();

  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const env = searchParams.get("env");
  const sort = searchParams.get("sort");

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(status || "all");
  const [sortFilter, setSortFilter] = useState(sort || "newest");
  const [envFilter, setEnvFilter] = useState(env || "prod");

  const activePartners = envFilter === "qa" ? qaPartners : partners;

  const handleChangeFilter = (key: string, value: string) => {
    if (key === "env") setEnvFilter(value);
    if (key === "status") setStatusFilter(value);
    if (key === "sort") setSortFilter(value);

    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set(key, value);

    router.push(`/admin/partners?${queryParams.toString()}`);
  };

  const filteredPartners = activePartners.filter(
    (partner: any) =>
      (statusFilter === "all" || partner.status === statusFilter) &&
      (globalFilter === "" ||
        (partner?.personalInfo?.firstName
          ? partner?.personalInfo?.firstName
              .toLowerCase()
              .includes(globalFilter.toLowerCase())
          : false) ||
        (partner?.personalInfo?.lastName
          ? partner?.personalInfo?.lastName
              .toLowerCase()
              .includes(globalFilter.toLowerCase())
          : false) ||
        partner?.email?.toLowerCase().includes(globalFilter.toLowerCase()))
  );

  const sortedPartners =
    sortFilter === "newest" ? filteredPartners.reverse() : filteredPartners;

  return (
    <div className="space-y-6">
      <Title className="mb-4 sm:mb-6" text="Partners" />

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search username or email..."
          className="w-full sm:max-w-[300px] rounded-[12px] h-12 sm:h-14"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => handleChangeFilter("status", value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14">
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Assisted Living">Assisted Living</SelectItem>
              <SelectItem value="Home care">Home care</SelectItem>
              <SelectItem value="Home Health">Home Health</SelectItem>
              <SelectItem value="Hospitals">Hospitals</SelectItem>
              <SelectItem value="Nursing Homes">Nursing Homes</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortFilter}
            onValueChange={(value) => handleChangeFilter("sort", value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={envFilter}
            onValueChange={(value) => handleChangeFilter("env", value)}
          >
            <SelectTrigger className="w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14">
              <SelectValue placeholder="Env" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prod">Prod</SelectItem>
              <SelectItem value="qa">QA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={partnerColumns} data={sortedPartners} />
    </div>
  );
}
