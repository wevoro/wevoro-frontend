"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/global/admin/data-table";
import { proColumns } from "@/components/global/admin/columns";
import Title from "@/components/global/title";
import { useAppContext } from "@/lib/context";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProsPage() {
  const { pros, qaPros } = useAppContext();

  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const env = searchParams.get("env");
  const sort = searchParams.get("sort");
  const router = useRouter();

  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(status || "all");
  const [sortFilter, setSortFilter] = useState(sort || "newest");
  const [envFilter, setEnvFilter] = useState(env || "prod");

  const handleChangeFilter = (key: string, value: string) => {
    // console.log({ key, value });
    if (key === "env") setEnvFilter(value);
    if (key === "status") setStatusFilter(value);
    if (key === "sort") setSortFilter(value);

    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set(key, value);

    router.push(`/admin/pros?${queryParams.toString()}`);
  };

  const activePros = envFilter === "qa" ? qaPros : pros;

  const filteredPros = activePros.filter(
    (pro: any) =>
      (statusFilter === "all" || pro.status === statusFilter) &&
      (globalFilter === "" ||
        (pro?.personalInfo?.firstName
          ? pro?.personalInfo?.firstName
              .toLowerCase()
              .includes(globalFilter.toLowerCase())
          : false) ||
        (pro?.personalInfo?.lastName
          ? pro?.personalInfo?.lastName
              .toLowerCase()
              .includes(globalFilter.toLowerCase())
          : false) ||
        pro?.email?.toLowerCase().includes(globalFilter.toLowerCase()))
  );

  const sortedPros =
    sortFilter === "newest" ? filteredPros.reverse() : filteredPros;

  // const handleStatusFilter = (value: string) => {
  //   setStatusFilter(value);

  //   router.push(`/admin/pros?status=${value}`);
  // };

  return (
    <div className="space-y-6">
      <Title className="mb-4 sm:mb-6" text="Pro's" />

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search username..."
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
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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

      <DataTable columns={proColumns} data={sortedPros} />
    </div>
  );
}
