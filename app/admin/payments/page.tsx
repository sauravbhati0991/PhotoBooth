"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Clock,
  Eye,
  Check,
  Plus,
  X,
  ChevronDown,
  ArrowLeft,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";

type Order = {
  _id: string;
  orderId: string;
  gifUrl: string;
  imageUrl: string;
  layoutTitle: string;
  rows: number;
  cols: number;
  amount: number;
  copies: number;
  paymentType: "online" | "cash";
  paymentStatus: "completed" | "pending";
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
};

export default function PaymentsPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Modal states
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [showCashModal, setShowCashModal] = useState(false);

  // Cash payment form (simplified — just amount & layout)
  const [cashAmount, setCashAmount] = useState("");
  const [cashLayout, setCashLayout] = useState("");
  const [cashSaving, setCashSaving] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<"analytics" | "orders">("analytics");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.set("paymentType", filterType);
      if (filterStatus) params.set("paymentStatus", filterStatus);

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ──────────────────── Analytics Computations ────────────────────

  const analytics = useMemo(() => {
    const completed = orders.filter((o) => o.paymentStatus === "completed");
    const now = new Date();

    // Today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayOrders = completed.filter((o) => new Date(o.createdAt) >= todayStart);
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.amount || 0), 0);

    // This week (Monday start)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const weekOrders = completed.filter((o) => new Date(o.createdAt) >= weekStart);
    const weekRevenue = weekOrders.reduce((s, o) => s + (o.amount || 0), 0);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = completed.filter((o) => new Date(o.createdAt) >= monthStart);
    const monthRevenue = monthOrders.reduce((s, o) => s + (o.amount || 0), 0);

    // All time
    const totalRevenue = completed.reduce((s, o) => s + (o.amount || 0), 0);
    const totalOrders = orders.length;

    // By type
    const onlineCompleted = completed.filter((o) => o.paymentType === "online");
    const cashCompleted = completed.filter((o) => o.paymentType === "cash");
    const onlineRevenue = onlineCompleted.reduce((s, o) => s + (o.amount || 0), 0);
    const cashRevenue = cashCompleted.reduce((s, o) => s + (o.amount || 0), 0);

    const pendingCount = orders.filter((o) => o.paymentStatus === "pending").length;
    const pendingRevenue = orders
      .filter((o) => o.paymentStatus === "pending")
      .reduce((s, o) => s + (o.amount || 0), 0);

    // Average order value
    const avgOrderValue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

    // Daily revenue for last 7 days (for bar chart)
    const last7Days: { label: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      const dayOrders = completed.filter((o) => {
        const c = new Date(o.createdAt);
        return c >= d && c < dEnd;
      });
      last7Days.push({
        label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        revenue: dayOrders.reduce((s, o) => s + (o.amount || 0), 0),
        count: dayOrders.length,
      });
    }
    const maxDailyRevenue = Math.max(...last7Days.map((d) => d.revenue), 1);

    // Top layouts
    const layoutMap: Record<string, { count: number; revenue: number }> = {};
    completed.forEach((o) => {
      const key = o.layoutTitle || "Unknown";
      if (!layoutMap[key]) layoutMap[key] = { count: 0, revenue: 0 };
      layoutMap[key].count++;
      layoutMap[key].revenue += o.amount || 0;
    });
    const topLayouts = Object.entries(layoutMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);

    return {
      todayRevenue,
      todayCount: todayOrders.length,
      weekRevenue,
      weekCount: weekOrders.length,
      monthRevenue,
      monthCount: monthOrders.length,
      totalRevenue,
      totalOrders,
      onlineCount: onlineCompleted.length,
      cashCount: cashCompleted.length,
      onlineRevenue,
      cashRevenue,
      pendingCount,
      pendingRevenue,
      avgOrderValue,
      last7Days,
      maxDailyRevenue,
      topLayouts,
    };
  }, [orders]);

  // ──────────────────── Handlers ────────────────────

  const handleMarkPaid = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "completed",
          paymentType: "cash",
        }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const handleAddCashPayment = async () => {
    if (!cashAmount || Number(cashAmount) <= 0) return;

    setCashSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutTitle: cashLayout || "Cash Entry",
          amount: Number(cashAmount),
          paymentType: "cash",
          paymentStatus: "completed",
        }),
      });

      if (res.ok) {
        setShowCashModal(false);
        setCashAmount("");
        setCashLayout("");
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to create cash order:", error);
    } finally {
      setCashSaving(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-6">
        <button
          onClick={() => router.push("/admin")}
          className="bg-white/20 cursor-pointer hover:bg-white/30 px-4 py-2 rounded-xl backdrop-blur-sm transition font-medium"
        >
          Back to Dashboard
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <h1 className="text-3xl font-bold text-center mb-2">Payment Tracker</h1>
        <p className="text-center text-white/60 mb-8">Track revenue, manage payments, and view analytics</p>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 ${activeTab === "analytics"
              ? "bg-white text-purple-600 shadow-lg"
              : "bg-white/20 text-white hover:bg-white/30"
              }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-2.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-2 ${activeTab === "orders"
              ? "bg-white text-purple-600 shadow-lg"
              : "bg-white/20 text-white hover:bg-white/30"
              }`}
          >
            <CreditCard size={18} />
            Orders
          </button>
        </div>

        {/* ═══════════════════ ANALYTICS TAB ═══════════════════ */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Revenue Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-5 shadow-xl border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-400/30 rounded-xl flex items-center justify-center">
                    <DollarSign size={20} className="text-emerald-200" />
                  </div>
                  <span className="text-white/70 text-sm">Today</span>
                </div>
                <p className="text-2xl font-bold">₹{analytics.todayRevenue.toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-1">{analytics.todayCount} order{analytics.todayCount !== 1 ? "s" : ""}</p>
              </div>

              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-5 shadow-xl border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-400/30 rounded-xl flex items-center justify-center">
                    <Calendar size={20} className="text-blue-200" />
                  </div>
                  <span className="text-white/70 text-sm">This Week</span>
                </div>
                <p className="text-2xl font-bold">₹{analytics.weekRevenue.toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-1">{analytics.weekCount} order{analytics.weekCount !== 1 ? "s" : ""}</p>
              </div>

              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-5 shadow-xl border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-400/30 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-purple-200" />
                  </div>
                  <span className="text-white/70 text-sm">This Month</span>
                </div>
                <p className="text-2xl font-bold">₹{analytics.monthRevenue.toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-1">{analytics.monthCount} order{analytics.monthCount !== 1 ? "s" : ""}</p>
              </div>

              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-5 shadow-xl border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-400/30 rounded-xl flex items-center justify-center">
                    <BarChart3 size={20} className="text-pink-200" />
                  </div>
                  <span className="text-white/70 text-sm">All Time</span>
                </div>
                <p className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                <p className="text-white/50 text-xs mt-1">{analytics.totalOrders} total order{analytics.totalOrders !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Revenue Chart + Payment Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Revenue Bar Chart */}
              <div className="lg:col-span-2 bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10">
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Last 7 Days Revenue
                </h3>
                <p className="text-white/50 text-xs mb-6">Daily revenue breakdown</p>

                <div className="flex items-end gap-3 h-48">
                  {analytics.last7Days.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-white/80">
                        {day.revenue > 0 ? `₹${day.revenue}` : "—"}
                      </span>
                      <div
                        className="w-full rounded-t-lg transition-all duration-500 relative group"
                        style={{
                          height: `${Math.max(4, (day.revenue / analytics.maxDailyRevenue) * 100)}%`,
                          background: day.revenue > 0
                            ? "linear-gradient(to top, rgba(255,255,255,0.3), rgba(255,255,255,0.6))"
                            : "rgba(255,255,255,0.1)",
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-purple-900/90 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-10">
                          <p className="font-bold">₹{day.revenue}</p>
                          <p className="text-white/60">{day.count} order{day.count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/60">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Type Breakdown */}
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10">
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <PieChart size={20} />
                  Payment Breakdown
                </h3>
                <p className="text-white/50 text-xs mb-6">By payment method</p>

                {/* Visual pie-like display */}
                <div className="space-y-5">
                  {/* Online */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full" />
                        <span className="text-sm font-medium">Online</span>
                      </div>
                      <span className="text-sm font-bold">₹{analytics.onlineRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-700"
                        style={{
                          width: analytics.totalRevenue > 0
                            ? `${(analytics.onlineRevenue / analytics.totalRevenue) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <p className="text-white/50 text-xs mt-1">{analytics.onlineCount} payment{analytics.onlineCount !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Cash */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                        <span className="text-sm font-medium">Cash</span>
                      </div>
                      <span className="text-sm font-bold">₹{analytics.cashRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-700"
                        style={{
                          width: analytics.totalRevenue > 0
                            ? `${(analytics.cashRevenue / analytics.totalRevenue) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <p className="text-white/50 text-xs mt-1">{analytics.cashCount} payment{analytics.cashCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Average */}
                <div className="mt-6 pt-5 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Avg. Order Value</span>
                    <span className="text-xl font-bold">₹{analytics.avgOrderValue}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Layouts */}
            {analytics.topLayouts.length > 0 && (
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10">
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Top Performing Layouts
                </h3>
                <p className="text-white/50 text-xs mb-5">Ranked by revenue</p>

                <div className="space-y-3">
                  {analytics.topLayouts.map(([name, data], i) => {
                    const maxRev = analytics.topLayouts[0][1].revenue || 1;
                    return (
                      <div key={name} className="flex items-center gap-4">
                        <span className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{name}</span>
                            <span className="text-sm font-bold">₹{data.revenue.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white/40 rounded-full transition-all duration-700"
                              style={{ width: `${(data.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                          <p className="text-white/40 text-[10px] mt-0.5">{data.count} order{data.count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ ORDERS TAB ═══════════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filters + Add Button */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none bg-white/20 backdrop-blur-lg text-white border border-white/30 rounded-xl px-4 py-2.5 pr-10 outline-none cursor-pointer"
                >
                  <option value="" className="text-gray-800">All Types</option>
                  <option value="online" className="text-gray-800">Online</option>
                  <option value="cash" className="text-gray-800">Cash</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/60" />
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-white/20 backdrop-blur-lg text-white border border-white/30 rounded-xl px-4 py-2.5 pr-10 outline-none cursor-pointer"
                >
                  <option value="" className="text-gray-800">All Status</option>
                  <option value="completed" className="text-gray-800">Completed</option>
                  <option value="pending" className="text-gray-800">Pending</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/60" />
              </div>

              <div className="flex-1" />

              <button
                onClick={() => setShowCashModal(true)}
                className="bg-white text-purple-600 hover:scale-105 cursor-pointer px-5 py-2.5 rounded-xl shadow-lg transition font-semibold flex items-center gap-2"
              >
                <Plus size={18} />
                Add Cash Payment
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/10 text-center">
                <p className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                <p className="text-white/60 text-xs">Revenue</p>
              </div>
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/10 text-center">
                <p className="text-2xl font-bold">{analytics.onlineCount}</p>
                <p className="text-white/60 text-xs">Online</p>
              </div>
              <div className="bg-white/15 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/10 text-center">
                <p className="text-2xl font-bold">{analytics.cashCount}</p>
                <p className="text-white/60 text-xs">Cash</p>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/10">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 text-white/60">
                  <p className="text-lg">No orders found</p>
                  <p className="text-sm mt-1">Orders will appear here after photobooth sessions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20 bg-white/5">
                        <th className="px-5 py-4 text-sm font-semibold text-white/80">Order ID</th>
                        <th className="px-5 py-4 text-sm font-semibold text-white/80">Layout Name</th>
                        <th className="px-5 py-4 text-sm font-semibold text-white/80">Amount</th>
                        <th className="px-5 py-4 text-sm font-semibold text-white/80">Type</th>
                        <th className="px-5 py-4 text-sm font-semibold text-white/80">Status</th>
                        <th className="px-5 py-4 text-sm font-semibold text-white/80">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          className="border-b border-white/10 hover:bg-white/5 transition"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-semibold bg-white/10 px-2 py-1 rounded-lg">
                              {order.orderId}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {order.layoutTitle}
                            {order.rows > 0 && order.cols > 0 && (
                              <span className="text-white/50 ml-1">
                                ({order.rows}×{order.cols})
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-semibold">
                            {order.amount === 0 ? "Free" : `₹${order.amount}`}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${order.paymentType === "online"
                                ? "bg-blue-400/20 text-blue-200"
                                : "bg-yellow-400/20 text-yellow-200"
                                }`}
                            >
                              {order.paymentType === "online" ? (
                                <CreditCard size={12} />
                              ) : (
                                <Banknote size={12} />
                              )}
                              {order.paymentType === "online" ? "Online" : "Cash"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${order.paymentStatus === "completed"
                                ? "bg-emerald-400/20 text-emerald-200"
                                : "bg-red-400/20 text-red-200"
                                }`}
                            >
                              {order.paymentStatus === "completed" ? (
                                <Check size={12} />
                              ) : (
                                <Clock size={12} />
                              )}
                              {order.paymentStatus === "completed"
                                ? "Completed"
                                : "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-white/70">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {(order.gifUrl || order.imageUrl) && (
                                <button
                                  onClick={() => setPreviewOrder(order)}
                                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
                                  title="Preview"
                                >
                                  <Eye size={16} />
                                </button>
                              )}

                              {order.paymentStatus === "pending" && (
                                <button
                                  onClick={() => handleMarkPaid(order.orderId)}
                                  className="px-3 py-1.5 bg-emerald-500/30 hover:bg-emerald-500/50 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                  title="Mark as Paid (Cash)"
                                >
                                  <Check size={14} />
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="text-center text-white/50 text-sm">
              Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewOrder(null)}
        >
          <div
            className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Order Preview</h2>
                <p className="text-white/70 text-sm font-mono">
                  {previewOrder.orderId}
                </p>
              </div>
              <button
                onClick={() => setPreviewOrder(null)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {previewOrder.gifUrl && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-white/70 text-sm font-medium">GIF</p>
                  <div className="bg-white/10 rounded-2xl p-3 w-full flex justify-center">
                    <img
                      src={previewOrder.gifUrl}
                      alt="GIF preview"
                      className="max-h-[300px] object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              {previewOrder.imageUrl && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-white/70 text-sm font-medium">Image</p>
                  <div className="bg-white/10 rounded-2xl p-3 w-full flex justify-center">
                    <img
                      src={previewOrder.imageUrl}
                      alt="Image preview"
                      className="max-h-[300px] object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs">Layout</p>
                <p className="font-semibold">{previewOrder.layoutTitle}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs">Amount</p>
                <p className="font-semibold">
                  {previewOrder.amount === 0 ? "Free" : `₹${previewOrder.amount}`}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs">Payment</p>
                <p className="font-semibold capitalize">{previewOrder.paymentType}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-xs">Status</p>
                <p className="font-semibold capitalize">{previewOrder.paymentStatus}</p>
              </div>
            </div>

            {previewOrder.razorpayPaymentId && (
              <div className="mt-4 bg-white/10 rounded-xl p-3 text-sm">
                <p className="text-white/60 text-xs mb-1">Razorpay Payment ID</p>
                <p className="font-mono text-xs">{previewOrder.razorpayPaymentId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Cash Payment Modal (simplified — just amount & layout) */}
      {showCashModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCashModal(false)}
        >
          <div
            className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Banknote size={22} />
                Add Cash Payment
              </h2>
              <button
                onClick={() => setShowCashModal(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/80 mb-1.5 font-medium">
                  Amount (₹) <span className="text-red-300">*</span>
                </label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/50 outline-none focus:border-white/60 transition text-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-1.5 font-medium">
                  Layout Name <span className="text-white/40">(optional)</span>
                </label>
                <input
                  type="text"
                  value={cashLayout}
                  onChange={(e) => setCashLayout(e.target.value)}
                  placeholder="e.g., Classic 2x2"
                  className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/50 outline-none focus:border-white/60 transition"
                />
              </div>

              <button
                onClick={handleAddCashPayment}
                disabled={cashSaving || !cashAmount || Number(cashAmount) <= 0}
                className={`w-full py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition shadow-xl mt-4
                  ${cashSaving || !cashAmount || Number(cashAmount) <= 0
                    ? "bg-white/40 text-white/50 cursor-not-allowed"
                    : "bg-white text-purple-600 cursor-pointer hover:scale-[1.02]"
                  }`}
              >
                {cashSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Banknote size={18} />
                    Add Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
