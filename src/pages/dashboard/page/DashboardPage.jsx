import { Users, TrendingUp, Heart, Wallet, UserCheck, ShoppingCart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const overviewData = [
    { label: 'Tổng người dùng', value: '12,458', change: '+12.5%', icon: Users },
    { label: 'Người chơi hoạt động', value: '3,247', change: '+8.2%', icon: UserCheck },
    { label: 'Tổng bước chân', value: '8,242,832', change: '+15.3%', icon: TrendingUp },
];

const detailedStats = [
    { label: 'Bước chân trung bình/ngày', value: '8,234', subtext: 'Trung bình mỗi người' },
    { label: 'Người đi bộ hôm nay', value: '2,891', subtext: '89% so với hôm qua' },
    { label: 'Khung giờ hoạt động', value: '6:00 - 8:00', subtext: '17:00 - 19:00' },
    { label: 'Tinh Linh phổ biến', value: 'Ánh Trăng', subtext: '42% người chơi' },
];

const stepsData = [
    { id: 'steps-mon', name: 'T2', steps: 45000 },
    { id: 'steps-tue', name: 'T3', steps: 52000 },
    { id: 'steps-wed', name: 'T4', steps: 48000 },
    { id: 'steps-thu', name: 'T5', steps: 61000 },
    { id: 'steps-fri', name: 'T6', steps: 55000 },
    { id: 'steps-sat', name: 'T7', steps: 67000 },
    { id: 'steps-sun', name: 'CN', steps: 72000 },
];

const newUsersData = [
    { id: 'users-week1', name: 'Tuần 1', users: 120 },
    { id: 'users-week2', name: 'Tuần 2', users: 150 },
    { id: 'users-week3', name: 'Tuần 3', users: 180 },
    { id: 'users-week4', name: 'Tuần 4', users: 140 },
    { id: 'users-week5', name: 'Tuần 5', users: 200 },
    { id: 'users-week6', name: 'Tuần 6', users: 190 },
];

const spiritActivityData = [
    { id: 'activity-feed', name: 'Cho ăn', value: 450 },
    { id: 'activity-pet', name: 'Vuốt ve', value: 380 },
    { id: 'activity-play', name: 'Đấu PvP', value: 320 },
];

const popularSpiritsData = [
    { name: 'Tinh Linh Ánh Trăng', value: 42, color: '#06B6D4' },
    { name: 'Tinh Linh Bình Minh', value: 35, color: '#22C55E' },
    { name: 'Tinh Linh Nắng Ấm', value: 23, color: '#F59E0B' },
];

const COLORS = ['#76A084', '#8ECAE6', '#E59A73', '#C5B8A8'];

const topPlayers = [
    { rank: 1, name: 'Nguyễn Văn A', steps: 125430, level: 24 },
    { rank: 2, name: 'Trần Thị B', steps: 118920, level: 22 },
    { rank: 3, name: 'Lê Văn C', steps: 112340, level: 21 },
    { rank: 4, name: 'Phạm Thị D', steps: 108560, level: 20 },
    { rank: 5, name: 'Hoàng Văn E', steps: 105230, level: 19 },
];

export function Dashboard() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-1 text-foreground">Tổng quan hệ thống</h1>
                <p className="text-sm text-muted-foreground">Chào mừng quay trở lại, Admin!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overviewData.map((item, index) => {
                    return (
                        <div key={index} className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-3">
                                <span className={`text-sm font-medium ${item.change.startsWith('+') ? 'text-[#76A084]' : 'text-[#DC6B6B]'}`}>
                                    {item.change}
                                </span>
                            </div>
                            <p className="text-4xl font-bold mb-2 text-foreground">{item.value}</p>
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-6 text-foreground">Thống kê chi tiết hệ thống</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {detailedStats.map((stat, index) => (
                        <div key={index} className="bg-muted p-6 rounded-xl">
                            <p className="text-3xl font-bold mb-2 text-foreground">{stat.value}</p>
                            <p className="text-sm text-foreground font-medium mb-1">{stat.label}</p>
                            <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="font-medium mb-4">Bước chân theo tuần</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stepsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid key="steps-grid" strokeDasharray="3 3" stroke="#E5DCCF" />
                            <XAxis key="steps-xaxis" dataKey="name" stroke="#9A8F82" />
                            <YAxis key="steps-yaxis" stroke="#9A8F82" />
                            <Tooltip key="steps-tooltip" />
                            <Legend key="steps-legend" />
                            <Line key="steps-line" type="monotone" dataKey="steps" stroke="#76A084" strokeWidth={2} name="Bước chân" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="font-medium mb-4">Người dùng mới theo tháng</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={newUsersData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid key="users-grid" strokeDasharray="3 3" stroke="#E5DCCF" />
                            <XAxis key="users-xaxis" dataKey="name" stroke="#9A8F82" />
                            <YAxis key="users-yaxis" stroke="#9A8F82" />
                            <Tooltip key="users-tooltip" />
                            <Legend key="users-legend" />
                            <Bar key="users-bar" dataKey="users" fill="#E59A73" name="Người dùng mới" radius={[8, 8, 0, 0]}>
                                {newUsersData.map((entry, index) => (
                                    <Cell key={`bar-cell-${entry.id}`} fill="#E59A73" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="font-medium mb-4">Hoạt động chăm sóc Tinh Linh</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                key="spirit-pie"
                                data={spiritActivityData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {spiritActivityData.map((entry, index) => (
                                    <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip key="spirit-tooltip" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium">Top 5 người chơi</h2>

                    </div>
                    <div className="space-y-3">
                        {topPlayers.map((player) => (
                            <div key={player.rank} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${player.rank === 1 ? 'bg-amber-500 text-white' :
                                        player.rank === 2 ? 'bg-gray-400 text-white' :
                                            player.rank === 3 ? 'bg-orange-600 text-white' :
                                                'bg-muted text-foreground'
                                    }`}>
                                    {player.rank}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{player.name}</p>
                                    <p className="text-xs text-muted-foreground">Level {player.level}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{player.steps.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">bước</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Dashboard;