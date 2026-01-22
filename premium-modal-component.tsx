// PremiumModal Component - To be inserted in index.tsx after FeedbackModal

const PremiumModal = ({ onClose }: { onClose: () => void }) => {
    const { language } = useContext(AppContext)!;
    const [selectedTier, setSelectedTier] = useState(1); // 0: Free, 1: Standard, 2: Ultimate

    const tiers = [
        {
            name: language === 'fr' ? 'Gratuit' : 'Free',
            price: language === 'fr' ? 'Gratuit' : 'Free',
            color: 'bg-gradient-to-br from-gray-100 to-gray-200',
            textColor: 'text-gray-700',
            features: [
                language === 'fr' ? '✓ Météo actuelle' : '✓ Current weather',
                language === 'fr' ? '✓ Prévisions 3h' : '✓ 3h forecast',
                language === 'fr' ? '✓ Carte communautaire' : '✓ Community map',
                language === 'fr' ? '✗ Données santé (AQI, UV, Pollen)' : '✗ Health data (AQI, UV, Pollen)',
                language === 'fr' ? '✗ Prévisions étendues' : '✗ Extended forecasts'
            ],
            cta: language === 'fr' ? 'Actuel' : 'Current',
            disabled: true,
            tierId: 'FREE'
        },
        {
            name: language === 'fr' ? 'Contributeur' : 'Contributor',
            price: language === 'fr' ? 'Gratuit (Donnant-Donnant)' : 'Free (Give-to-Get)',
            color: 'bg-gradient-to-br from-green-400 to-emerald-600',
            textColor: 'text-white',
            features: [
                language === 'fr' ? '✓ Toutes fonctionnalités ULTIMATE' : '✓ All ULTIMATE features',
                language === 'fr' ? '✓ Carte Défloutée' : '✓ Unblurred Map',
                language === 'fr' ? '⚠️ 2 Contributions / jour requises' : '⚠️ 2 Reports / day required',
                language === 'fr' ? '⚠️ Bandeau Publicitaire' : '⚠️ Ad Banner',
                language === 'fr' ? '❤️ Soutenez la communauté' : '❤️ Support community'
            ],
            cta: language === 'fr' ? 'Activer (Gratuit)' : 'Activate (Free)',
            disabled: false,
            tierId: 'CONTRIBUTOR'
        },
        {
            name: 'Standard',
            price: language === 'fr' ? '2.99€ / mois' : '$2.99 / month',
            color: 'bg-gradient-to-br from-blue-400 to-blue-600',
            textColor: 'text-white',
            features: [
                language === 'fr' ? '✓ Tout du Gratuit' : '✓ Everything in Free',
                language === 'fr' ? '✓ Données santé complètes' : '✓ Full health data',
                language === 'fr' ? '✓ Prévisions 12h' : '✓ 12h forecast',
                language === 'fr' ? '✓ Alertes personnalisées' : '✓ Custom alerts',
                language === 'fr' ? '✓ Sans publicité' : '✓ Ad-free'
            ],
            cta: language === 'fr' ? 'Choisir Standard' : 'Choose Standard',
            disabled: false,
            tierId: 'STANDARD'
        },
        {
            name: 'Ultimate',
            price: language === 'fr' ? '5.99€ / mois' : '$5.99 / month',
            color: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
            textColor: 'text-white',
            features: [
                language === 'fr' ? '✓ Tout du Standard' : '✓ Everything in Standard',
                language === 'fr' ? '✓ Prévisions 7 jours' : '✓ 7-day forecast',
                language === 'fr' ? '✓ Analyses météo IA' : '✓ AI weather insights',
                language === 'fr' ? '✓ Données historiques' : '✓ Historical data',
                language === 'fr' ? '✓ Support prioritaire' : '✓ Priority support'
            ],
            cta: language === 'fr' ? 'Choisir Ultimate' : 'Choose Ultimate',
            disabled: false,
            tierId: 'ULTIMATE'
        }
    ];

    const handleSubscribe = (tierIndex: number) => {
        const tier = tiers[tierIndex];
        if (tier.tierId === 'FREE') return;

        if (tier.tierId === 'CONTRIBUTOR') {
            // Activate Contributor Mode
            // We need a way to call this from AppContext or check logic
            alert(language === 'fr' ? "Mode Contributeur Activé ! N'oubliez pas vos 2 contributions par jour." : "Contributor Mode Activated! Don't forget your 2 daily reports.");
            // TODO: Real activation logic linking to user profile
            onClose();
            return;
        }

        alert(`Subscription to ${tier.name} - Integration Stripe upcoming`);
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-white/80 hover:text-white">
                        <X size={24} />
                    </button>
                    <div className="text-center">
                        <Crown size={48} className="mx-auto mb-3 text-yellow-300" />
                        <h2 className="text-3xl font-bold mb-2">
                            {language === 'fr' ? 'Passez à Premium' : 'Upgrade to Premium'}
                        </h2>
                        <p className="text-blue-100">
                            {language === 'fr' ? 'Choisissez le plan qui vous convient' : 'Choose the plan that fits you'}
                        </p>
                    </div>
                </div>

                {/* Carousel */}
                <div className="p-6">
                    <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
                        {tiers.map((tier, index) => (
                            <div
                                key={index}
                                className={`flex-shrink-0 w-80 snap-center rounded-xl p-6 transition-all duration-300 ${selectedTier === index ? 'ring-4 ring-blue-500 scale-105' : 'opacity-75 hover:opacity-100'
                                    }`}
                                style={{ background: `linear-gradient(135deg, ${tier.color.replace('from-', '').replace(' to-', ', ')})` }}
                                onClick={() => setSelectedTier(index)}
                            >
                                <div className={tier.textColor}>
                                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                                    <p className="text-3xl font-extrabold mb-6">{tier.price}</p>

                                    <ul className="space-y-3 mb-6">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-lg">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSubscribe(index)}
                                        disabled={tier.disabled}
                                        className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all ${tier.disabled
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl'
                                            }`}
                                    >
                                        {tier.cta}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 text-center text-sm text-gray-600">
                    {language === 'fr' ? 'Annulez à tout moment • Paiement sécurisé via Stripe' : 'Cancel anytime • Secure payment via Stripe'}
                </div>
            </div>
        </div>
    );
};
