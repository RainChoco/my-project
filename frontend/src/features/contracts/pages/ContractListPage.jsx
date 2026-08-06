import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NativeSelect } from '@/features/tenders/components/NativeSelect';
import { fetchContracts, deleteContract } from '../services/contractApi';
import { STATUS_VALUES, STATUS_BADGE_VARIANTS, CATEGORY_VALUES } from '../constants';

function ConfirmDeleteContractDialog({ contract, isPending, onConfirm, onCancel }) {
  return (
    <Dialog open={Boolean(contract)} onOpenChange={(open) => !open && onCancel()}>
      {contract && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete contract</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{contract.name}</strong> ({contract.id}). This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function ContractListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [contractToDelete, setContractToDelete] = useState(null);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setContractToDelete(null);
    },
    onError: () => setContractToDelete(null),
  });

  const filteredContracts = (contracts ?? []).filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = term
      ? [c.name, c.id, c.contractRefNo, c.townCouncilName].some((field) => field?.toLowerCase().includes(term))
      : true;
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesCategory = categoryFilter ? c.category === categoryFilter : true;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const hasActiveFilters = Boolean(searchTerm || statusFilter || categoryFilter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contract Opportunities</h1>
          <p className="text-sm text-muted-foreground">Browse, create, and manage Town Council contract opportunities.</p>
        </div>
        <Button asChild>
          <Link to="/contracts/new">
            <Plus className="mr-2 h-4 w-4" /> Create Contract
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contract-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contract-search"
                  placeholder="Search by name, ID, reference no., or Town Council..."
                  className="w-72 pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contract-status">Status</Label>
              <NativeSelect
                id="contract-status"
                className="w-44"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contract-category">Category</Label>
              <NativeSelect
                id="contract-category"
                className="w-56"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORY_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCategoryFilter('');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
          <CardDescription>{filteredContracts.length} contract(s) on record</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && filteredContracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No contracts found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{contract.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{contract.name}</TableCell>
                    <TableCell>
                      {contract.townCouncilName ? (
                        <Badge variant="outline">{contract.townCouncilName}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{contract.category}</TableCell>
                    <TableCell>${parseFloat(contract.budgetLimit).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANTS[contract.status] ?? 'secondary'}>{contract.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/contracts/${contract.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/contracts/${contract.id}/edit`}>
                            <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit
                          </Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setContractToDelete(contract)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDeleteContractDialog
        contract={contractToDelete}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(contractToDelete.id)}
        onCancel={() => setContractToDelete(null)}
      />
    </div>
  );
}

export default ContractListPage;
