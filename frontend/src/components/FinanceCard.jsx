import { TrendingUp, TrendingDown } from 'lucide-react';

const FinanceCard = ({ item, type }) => {
    const isIng = type === 'ingreso';
    return (
        <div className={`p-4 rounded-2xl shadow-sm border flex items-center justify-between transition-colors ${
            isIng 
                ? 'bg-green-100/50 dark:bg-green-950/30 border-white dark:border-green-900/30' 
                : 'bg-red-100/50 dark:bg-red-950/30 border-white dark:border-red-900/30'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isIng ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {isIng ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase opacity-60 text-gray-500 dark:text-gray-400">{isIng ? 'Cobro' : 'Pago'}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{isIng ? item.empresa_nombre : item.observacion || 'Gasto'}</p>
                </div>
            </div>
            <div className={`font-black text-base ${isIng ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {isIng && item.moneda === 'USD' ? '$' : 'Bs. '}{item.monto}
            </div>
        </div>
    );
};
export default FinanceCard;