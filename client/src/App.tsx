import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { TransactionsPage } from './pages/TransactionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { InsightsPage } from './pages/InsightsPage';
import { AdminPage } from './pages/AdminPage';
import { Navbar } from './components/Navbar';
import { TransactionModal } from './components/TransactionModal';
import { CsvImportModal } from './components/CsvImportModal';
import { SitemapModal } from './components/SitemapModal';
import type { Transaction, Category } from './types';
import { api } from './services/api';

function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isSitemapOpen, setIsSitemapOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const handleNavigateFromSitemap = (tab: string) => {
    setCurrentTab(tab);
  };

  const handleTxSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsAddTxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm font-semibold">Loading Campus Coin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSitemap={() => setIsSitemapOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            key={`dashboard-${refreshKey}`}
            onOpenAddTx={() => {
              setTxToEdit(null);
              setIsAddTxOpen(true);
            }}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsPage
            key={`transactions-${refreshKey}`}
            onOpenAddTx={() => {
              setTxToEdit(null);
              setIsAddTxOpen(true);
            }}
            onOpenImportCsv={() => setIsCsvImportOpen(true)}
            onEditTx={handleOpenEditTx}
            categories={categories}
          />
        )}

        {currentTab === 'categories' && (
          <CategoriesPage key={`categories-${refreshKey}`} />
        )}

        {currentTab === 'reports' && (
          <ReportsPage key={`reports-${refreshKey}`} />
        )}

        {currentTab === 'budgets' && (
          <BudgetsPage key={`budgets-${refreshKey}`} categories={categories} />
        )}

        {currentTab === 'insights' && (
          <InsightsPage key={`insights-${refreshKey}`} />
        )}

        {currentTab === 'admin' && user.role === 'admin' && (
          <AdminPage key={`admin-${refreshKey}`} />
        )}
      </main>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setTxToEdit(null);
        }}
        onSuccess={handleTxSuccess}
        categories={categories}
        transactionToEdit={txToEdit}
      />

      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onSuccess={handleTxSuccess}
      />

      <SitemapModal
        isOpen={isSitemapOpen}
        onClose={() => setIsSitemapOpen(false)}
        onNavigate={handleNavigateFromSitemap}
      />
    </div>
  );
}

export default App;
