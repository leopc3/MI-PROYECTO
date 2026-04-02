import { TrendingUp, TrendingDown } from 'lucide-react';

const FinanceCard = ({ item, type }) => {
    const isIng = type === 'ingreso';
    return (
        <div className={`p-4 rounded-2xl shadow-sm border border-white flex items-center justify-between ${isIng ? 'bg-green-100/50' : 'bg-red-100/50'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isIng ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {isIng ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase opacity-40">{isIng ? 'Cobro' : 'Pago'}</p>
                    <p className="font-bold text-gray-800 text-sm">{isIng ? item.empresa_nombre : item.observacion || 'Gasto'}</p>
                </div>
            </div>
            <div className={`font-black text-base ${isIng ? 'text-green-700' : 'text-red-700'}`}>
                {isIng && item.moneda === 'USD' ? '$' : 'Bs. '}{item.monto}
            </div>
        </div>
    );
};
export default FinanceCard;