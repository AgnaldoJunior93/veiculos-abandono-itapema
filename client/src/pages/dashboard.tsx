import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, AlertTriangle, Megaphone, TrendingUp, Activity, CheckCircle, Users } from "lucide-react";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/metrics"],
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/campaigns"],
  });

  if (metricsLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gov-gray">Dashboard</h2>
          <p className="text-gray-600">Visão geral do sistema de veículos abandonados e campanhas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns?.filter((c: any) => c.status === "ativa") || [];
  const recentActivity = [
    ...(vehicles?.slice(-3).map((v: any) => ({
      type: "vehicle",
      title: "Novo veículo cadastrado",
      description: `Placa ${v.placa} - ${v.endereco}`,
      time: "2h atrás",
      icon: Car,
      bgColor: "bg-blue-100",
      iconColor: "text-gov-blue"
    })) || []),
    ...(activeCampaigns.slice(-2).map((c: any) => ({
      type: "campaign",
      title: "Campanha ativa",
      description: `${c.nome} - ${c.area}`,
      time: "1d atrás",
      icon: Megaphone,
      bgColor: "bg-amber-100", 
      iconColor: "text-gov-amber"
    })) || [])
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gov-gray">Dashboard</h2>
        <p className="text-gray-600">Visão geral do sistema de veículos abandonados e campanhas</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Veículos</p>
                <p className="text-3xl font-bold text-gov-gray">{metrics?.totalVehicles || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Car className="h-6 w-6 text-gov-blue" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-500 ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fora do Prazo</p>
                <p className="text-3xl font-bold text-gov-red">{metrics?.overdueVehicles || 0}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-gov-red" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-600 font-medium">-5%</span>
              <span className="text-gray-500 ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Campanhas Ativas</p>
                <p className="text-3xl font-bold text-gov-green">{metrics?.activeCampaigns || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Megaphone className="h-6 w-6 text-gov-green" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+3</span>
              <span className="text-gray-500 ml-1">novas este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Remoção</p>
                <p className="text-3xl font-bold text-gov-amber">{metrics?.removalRate || 0}%</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-gov-amber" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+8%</span>
              <span className="text-gray-500 ml-1">pós-campanhas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Remoções por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico será implementado com dados reais</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Efetividade das Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Gráfico será implementado com dados reais</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`${activity.bgColor} p-2 rounded-full`}>
                    <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gov-gray">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
