import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertVehicleSchema, type InsertVehicle, type Vehicle } from "../../shared/schema"; // Corrigido o path
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
}

export default function VehicleModal({ isOpen, onClose, vehicle }: VehicleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!vehicle;

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      placa: vehicle?.placa || "",
      endereco: vehicle?.endereco || "",
      dataNotificacao: vehicle?.dataNotificacao || "",
      prazoFinal: vehicle?.prazoFinal || "",
      status: vehicle?.status || "aguardando_remocao",
      agente: vehicle?.agente || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      if (isEditing) {
        await apiRequest("PUT", `/api/vehicles/${vehicle!.id}`, data);
      } else {
        await apiRequest("POST", "/api/vehicles", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Sucesso",
        description: `Veículo ${isEditing ? "atualizado" : "cadastrado"} com sucesso.`,
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: `Erro ao ${isEditing ? "atualizar" : "cadastrar"} veículo.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertVehicle) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Veículo" : "Cadastrar Novo Veículo"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agente Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do agente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço completo onde o veículo foi encontrado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataNotificacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Notificação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prazoFinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo Final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="aguardando_remocao">Aguardando Remoção</SelectItem>
                      <SelectItem value="removido_patio">Removido ao Pátio</SelectItem>
                      <SelectItem value="removido_proprietario">Removido pelo Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-gov-blue hover:bg-gov-blue/90"
              >
                {mutation.isPending ? "Salvando..." : (isEditing ? "Atualizar" : "Salvar")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
