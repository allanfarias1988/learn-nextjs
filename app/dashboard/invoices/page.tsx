import { z } from "zod";
import { Suspense } from "react";
import { lusitana } from "@/app/ui/fonts";
import Search from "@/app/ui/search";
import { CreateInvoice } from "@/app/ui/invoices/buttons";
import Table from "@/app/ui/invoices/table";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import Pagination from "@/app/ui/invoices/pagination";
import { fetchInvoicesPages } from "@/app/lib/data";

// Esquema de validação para searchParams
const SearchParamsSchema = z.object({
	query: z.string().optional().default(""),
	page: z.string().optional().default("1"),
});

type PageProps = {
	searchParams: Promise<z.infer<typeof SearchParamsSchema>>;
};

export default async function Page({ searchParams }: PageProps) {
	// Aguarda os searchParams
	const resolvedParams = await searchParams;

	// Garante que os parâmetros são válidos
	const params = {
		query: resolvedParams?.query ?? "",
		page: resolvedParams?.page ?? "1",
	};

	// Valida os parâmetros
	const validatedParams = SearchParamsSchema.parse(params);

	const query = validatedParams.query;
	const currentPage = Number(validatedParams.page);

	let totalPages = 1;
	try {
		totalPages = await fetchInvoicesPages(query);
	} catch (error) {
		console.error("Erro ao carregar páginas:", error);
	}

	return (
		<div className="w-full">
			<div className="flex w-full items-center justify-between">
				<h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
			</div>
			<div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
				<Search placeholder="Search invoices..." />
				<CreateInvoice />
			</div>
			<Suspense
				key={`${query}-${currentPage}`}
				fallback={<InvoicesTableSkeleton />}
			>
				<Table query={query} currentPage={currentPage} />
			</Suspense>
			<div className="mt-5 flex w-full justify-center">
				{totalPages > 0 && <Pagination totalPages={totalPages} />}
			</div>
		</div>
	);
}
