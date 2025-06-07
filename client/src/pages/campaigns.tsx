import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CampaignModal from "@/components/campaign-modal";
import { Plus, Edit, Trash2, Eye, Download, Megaphone, Play, Users, TrendingUp } from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function Campaigns() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Sucesso",
        description: "Campanha excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir campanha.",
        variant: "destructive",
      });
    },
  });

  const activeCampaigns = campaigns?.filter(c => c.status === "ativa") || [];
  const plannedCampaigns = campaigns?.filter(c => c.status === "planejada") || [];
  const finishedCampaigns = campaigns?.filter(c => c.status === "finalizada") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativa":
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case "planejada":
        return <Badge className="bg-blue-100 text-blue-800">Planejada</Badge>;
      case "finalizada":
        return <Badge variant="secondary">Finalizada</Badge>;
      case "cancelada":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta campanha?")) {
      deleteMutation.mutate(id);
    }
  };

  const openNewCampaignModal = () => {
    setSelectedCampaign(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const avgEngagement = campaigns?.length > 0 
    ? Math.round(campaigns.reduce((acc, c) => acc + (c.engajamentoAtual || 0), 0) / campaigns.length)
    : 0;

  const totalRemovals = campaigns?.reduce((acc, c) => acc + (c.remocoesPosCampanha || 0), 0) || 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gov-gray">Campanhas de Conscientização</h2>
          <p className="text-gray-600">Gerenciamento de campanhas educativas sobre veículos abandonados</p>
        </div>
        <Button onClick={openNewCampaignModal} className="bg-gov-blue hover:bg-gov-blue/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-gov-green">{activeCampaigns.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Play className="h-5 w-5 text-gov-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engajamento Médio</p>
                <p className="text-2xl font-bold text-gov-blue">{avgEngagement}%</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-5 w-5 text-gov-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remoções Pós-Campanha</p>
                <p className="text-2xl font-bold text-gov-amber">{totalRemovals}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-gov-amber" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      {activeCampaigns.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Campanhas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(campaign.status)}
                    <span className="text-xs text-gray-500">
                      {Math.ceil((new Date(campaign.dataFim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                    </span>
                  </div>
                  <h4 className="font-semibold text-gov-gray mb-2">{campaign.nome}</h4>
                  <p className="text-sm text-gray-600 mb-3">{campaign.descricao}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Engajamento: {campaign.engajamentoAtual || 0}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(campaign)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Campanhas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {campaigns?.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha cadastrada</h3>
              <p className="text-gray-500">Comece criando sua primeira campanha de conscientização.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Engajamento</TableHead>
                  <TableHead>Remoções</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns?.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.nome}</TableCell>
                    <TableCell>
                      {new Date(campaign.dataInicio).toLocaleDateString('pt-BR')} - {new Date(campaign.dataFim).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{campaign.area}</TableCell>
                    <TableCell>{campaign.engajamentoAtual || 0}%</TableCell>
                    <TableCell>{campaign.remocoesPosCampanha || 0} veículos</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(campaign.id)}
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

      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign}
      />
    </div>
  );
}
