import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApiKeySchema, type InsertApiKey, type ApiKey } from "../../shared/schema";
import { Plus, Copy, Trash2, Code, Key, ExternalLink } from "lucide-react";

export default function ApiAccess() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const form = useForm<InsertApiKey>({
    resolver: zodResolver(insertApiKeySchema),
    defaultValues: {
      name: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertApiKey) => {
      const response = await apiRequest("POST", "/api/api-keys", data);
      return await response.json();
    },
    onSuccess: (newApiKey) => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "Sucesso",
        description: "Chave de API criada com sucesso.",
      });
      alert(`Nova chave criada: ${newApiKey.key}\n\nIMPORTANTE: Esta é a única vez que você verá a chave completa. Copie e guarde em local seguro.`);
      setIsModalOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar chave de API.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "Sucesso",
        description: "Chave de API excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir chave de API.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado",
        description: "Chave copiada para a área de transferência.",
      });
    });
  };

  const onSubmit = (data: InsertApiKey) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta chave de API?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const endpoints = [
    { method: "GET", path: "/api/vehicles", description: "Lista todos os veículos cadastrados" },
    { method: "POST", path: "/api/vehicles", description: "Cadastra um novo veículo" },
    { method: "PUT", path: "/api/vehicles/:id", description: "Atualiza um veículo existente" },
    { method: "DELETE", path: "/api/vehicles/:id", description: "Remove um veículo" },
    { method: "GET", path: "/api/metrics", description: "Retorna métricas do sistema" },
  ];

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-amber-100 text-amber-800",
      DELETE: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {method}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gov-gray">API Access</h2>
        <p className="text-gray-600">Integração com sistemas externos e acesso programático aos dados</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Chaves de API
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gov-blue hover:bg-gov-blue/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar Nova Chave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar Nova Chave de API</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Chave</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Integração Sistema X" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending} className="bg-gov-blue hover:bg-gov-blue/90">
                        {createMutation.isPending ? "Gerando..." : "Gerar Chave"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys?.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma chave de API</h3>
              <p className="text-gray-500">Gere sua primeira chave para começar a usar a API.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys?.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gov-gray">{apiKey.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{apiKey.key}</p>
                    <p className="text-xs text-gray-400">
                      Criada em {new Date(apiKey.createdAt).toLocaleDateString('pt-BR')}
                      {apiKey.lastUsed && ` - Último uso: ${new Date(apiKey.lastUsed).toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(apiKey.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Endpoints Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="border-l-4 border-blue-400 pl-4">
                  <div className="flex items-center space-x-2 mb-1">
                    {getMethodBadge(endpoint.method)}
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="text-sm text-gray-600">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exemplo de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 text-sm mb-4">
              <pre className="text-green-400 overflow-x-auto">
                <code>{`curl -X GET \
  'https://api.veiculos-itapema.gov.br/api/vehicles' \
  -H 'Authorization: Bearer sk_prod_your_key_here' \
  -H 'Content-Type: application/json'`}</code>
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-gov-gray mb-2">Resposta:</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <pre className="text-gray-700 overflow-x-auto">
                  <code>{`{
  "data": [
    {
      "id": 1,
      "placa": "ABC-1234",
      "endereco": "Rua das Flores, 123",
      "status": "aguardando_remocao",
      "dataNotificacao": "2024-01-15",
      "prazoFinal": "2024-01-29"
    }
  ],
  "total": 142
}`}</code>
                </pre>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Documentação Completa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
