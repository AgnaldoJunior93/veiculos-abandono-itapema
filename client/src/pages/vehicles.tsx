import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import VehicleModal from "@/components/vehicle-modal";
import { Plus, Edit, Trash2, Filter, Search, Car } from "lucide-react";
import type { Vehicle } from "@shared/schema";

export default function Vehicles() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Sucesso",
        description: "Veículo excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro", 
        description: "Erro ao excluir veículo.",
        variant: "destructive",
      });
    },
  });

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.placa.toLowerCase().includes(filter.toLowerCase()) ||
                         vehicle.endereco.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const now = new Date();
    switch (status) {
      case "aguardando_remocao":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aguardando Remoção</Badge>;
      case "removido_patio":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Removido ao Pátio</Badge>;
      case "removido_proprietario":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Removido pelo Proprietário</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isOverdue = (vehicle: Vehicle) => {
    const now = new Date();
    const prazoFinal = new Date(vehicle.prazoFinal);
    return prazoFinal < now && vehicle.status === "aguardando_remocao";
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
      deleteMutation.mutate(id);
    }
  };

  const openNewVehicleModal = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gov-gray">Veículos Abandonados</h2>
          <p className="text-gray-600">Gerenciamento de veículos abandonados na cidade</p>
        </div>
        <Button onClick={openNewVehicleModal} className="bg-gov-blue hover:bg-gov-blue/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por placa ou endereço..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="aguardando_remocao">Aguardando Remoção</SelectItem>
                <SelectItem value="removido_patio">Removido ao Pátio</SelectItem>
                <SelectItem value="removido_proprietario">Removido pelo Proprietário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardContent className="p-0">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {vehicles?.length === 0 ? "Nenhum veículo cadastrado" : "Nenhum veículo encontrado"}
              </h3>
              <p className="text-gray-500">
                {vehicles?.length === 0 
                  ? "Comece cadastrando o primeiro veículo abandonado."
                  : "Tente alterar os filtros de busca."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Data Notificação</TableHead>
                  <TableHead>Prazo Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className={isOverdue(vehicle) ? "bg-red-50" : ""}>
                    <TableCell className="font-medium">{vehicle.placa}</TableCell>
                    <TableCell>{vehicle.endereco}</TableCell>
                    <TableCell>{new Date(vehicle.dataNotificacao).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {new Date(vehicle.prazoFinal).toLocaleDateString('pt-BR')}
                        {isOverdue(vehicle) && (
                          <Badge variant="destructive" className="text-xs">Fora do Prazo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                    <TableCell>{vehicle.agente}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={selectedVehicle}
      />
    </div>
  );
}
