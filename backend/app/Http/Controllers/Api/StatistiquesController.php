<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Beneficiaire;
use App\Models\Participant;
use App\Models\Campagne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StatistiquesController extends Controller
{
    /**
     * Obtenir les statistiques complètes d'une campagne
     */
    public function getStatistiquesCampagne($campagneId)
    {
        try {
            // Récupérer la campagne avec son type d'assistance
            $campagne = Campagne::with('typeAssistance')->findOrFail($campagneId);

            // Récupérer tous les participants de la campagne
            $participants = Participant::where('campagne_id', $campagneId)->get();

            // Récupérer tous les bénéficiaires de la campagne
            $beneficiaires = Beneficiaire::where('campagne_id', $campagneId)->get();

            // Compter les bénéficiaires acceptés
            $beneficiairesAcceptes = $beneficiaires->where('decision', 'Accepté')->count();
            
            // Récupérer le crédit consommé depuis la campagne
            $creditConsomme = $campagne->credit_consomme ?? 0;
            
            // Calculer le prix unitaire dynamiquement
            $prixUnitaire = $beneficiairesAcceptes > 0 
                ? round($campagne->budget / $beneficiairesAcceptes, 2)
                : 0;

            // Calculer les statistiques
            $statistiques = [
                'campagne' => [
                    'id' => $campagne->id,
                    'nom' => $campagne->nom,
                    'type_assistance' => $campagne->typeAssistance->libelle ?? 'Non spécifié',
                    'statut' => $campagne->statut,
                    'date_debut' => $campagne->date_debut,
                    'date_fin' => $campagne->date_fin,
                    'budget' => $campagne->budget,
                    'prix_unitaire' => $prixUnitaire,
                    'credit_consomme' => $creditConsomme,
                ],
                'participants' => $this->calculerStatistiquesParticipants($participants),
                'beneficiaires' => $this->calculerStatistiquesBeneficiaires($beneficiaires),
                'indicateurs' => $this->calculerIndicateurs($participants, $beneficiaires),
            ];

            // Ajouter les statistiques spécifiques aux appareils auditifs si nécessaire
            if (stripos($campagne->typeAssistance->libelle ?? '', 'auditif') !== false) {
                $statistiques['auditifs'] = $this->calculerStatistiquesAuditifs($participants, $beneficiaires);
            }

            return response()->json([
                'success' => true,
                'data' => $statistiques
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getStatistiquesCampagne', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculer les statistiques des participants
     */
    private function calculerStatistiquesParticipants($participants)
    {
        $total = $participants->count();
        
        // Statistiques par sexe
        $parSexe = [
            'M' => $participants->where('sexe', 'M')->count(),
            'F' => $participants->where('sexe', 'F')->count(),
        ];

        // Statistiques par tranche d'âge
        $parAge = $this->repartirParTrancheAge($participants);

        // Statistiques par statut
        $parStatut = [
            'oui' => $participants->where('statut', 'Oui')->count(),
            'non' => $participants->where('statut', 'Non')->count(),
            'en_attente' => $participants->where('statut', 'En attente')->count(),
        ];

        // Statistiques par commune (top 10)
        $parCommune = $participants
            ->groupBy('commune_id')
            ->map(function ($group) {
                return [
                    'commune' => $group->first()->commune->nom ?? 'Non spécifiée',
                    'count' => $group->count()
                ];
            })
            ->sortByDesc('count')
            ->take(10)
            ->values();

        return [
            'total' => $total,
            'par_sexe' => $parSexe,
            'par_age' => $parAge,
            'par_statut' => $parStatut,
            'par_commune' => $parCommune,
        ];
    }

    /**
     * Calculer les statistiques des bénéficiaires
     */
    private function calculerStatistiquesBeneficiaires($beneficiaires)
    {
        $total = $beneficiaires->count();
        
        // Statistiques par sexe
        $parSexe = [
            'M' => $beneficiaires->where('sexe', 'M')->count(),
            'F' => $beneficiaires->where('sexe', 'F')->count(),
        ];

        // Statistiques par tranche d'âge
        $parAge = $this->repartirParTrancheAge($beneficiaires);

        // Statistiques par décision
        $parDecision = [
            'accepte' => $beneficiaires->where('decision', 'Accepté')->count(),
            'refuse' => $beneficiaires->where('decision', 'Refusé')->count(),
            'en_attente' => $beneficiaires->where('decision', 'En attente')->count(),
        ];

        // Statistiques des enfants scolarisés
        $enfantsScolarises = $beneficiaires->where('enfant_scolarise', true);
        $scolarisesStats = [
            'total' => $enfantsScolarises->count(),
            'M' => $enfantsScolarises->where('sexe', 'M')->count(),
            'F' => $enfantsScolarises->where('sexe', 'F')->count(),
        ];

        // Statistiques par commune (top 10)
        $parCommune = $beneficiaires
            ->groupBy('commune_id')
            ->map(function ($group) {
                return [
                    'commune' => $group->first()->commune->nom ?? 'Non spécifiée',
                    'count' => $group->count()
                ];
            })
            ->sortByDesc('count')
            ->take(10)
            ->values();

        return [
            'total' => $total,
            'par_sexe' => $parSexe,
            'par_age' => $parAge,
            'par_decision' => $parDecision,
            'enfants_scolarises' => $scolarisesStats,
            'par_commune' => $parCommune,
        ];
    }

    /**
     * Calculer les statistiques spécifiques aux appareils auditifs (AMÉLIORÉ)
     */
    /**
 * Calculer les statistiques spécifiques aux appareils auditifs (CORRIGÉ)
 */
private function calculerStatistiquesAuditifs($participants, $beneficiaires)
{
    // Statistiques pour TOUS les participants
    $participantsParCote = [
        'unilateral' => $participants->where('cote', 'Unilatéral')->count(),
        'bilateral' => $participants->where('cote', 'Bilatéral')->count(),
        'non_specifie' => $participants->filter(function($item) {
            return is_null($item->cote) || 
                   $item->cote === '' || 
                   $item->cote === 'Non spécifié';
        })->count(),
    ];

    // Statistiques pour les BÉNÉFICIAIRES (tous)
    $beneficiairesParCote = [
        'unilateral' => $beneficiaires->where('cote', 'Unilatéral')->count(),
        'bilateral' => $beneficiaires->where('cote', 'Bilatéral')->count(),
        'non_specifie' => $beneficiaires->filter(function($item) {
            return is_null($item->cote) || 
                   $item->cote === '' || 
                   $item->cote === 'Non spécifié';
        })->count(),
    ];

    // Statistiques pour les BÉNÉFICIAIRES ACCEPTÉS uniquement
    $beneficiairesAcceptes = $beneficiaires->where('decision', 'Accepté');
    
    $beneficiairesAcceptesParCote = [
        'unilateral' => $beneficiairesAcceptes->where('cote', 'Unilatéral')->count(),
        'bilateral' => $beneficiairesAcceptes->where('cote', 'Bilatéral')->count(),
        'non_specifie' => $beneficiairesAcceptes->filter(function($item) {
            return is_null($item->cote) || 
                   $item->cote === '' || 
                   $item->cote === 'Non spécifié';
        })->count(),
    ];

    // Répartition par sexe des bénéficiaires acceptés selon le côté
    $beneficiairesAcceptesParCoteEtSexe = [
        'unilateral' => [
            'M' => $beneficiairesAcceptes->where('cote', 'Unilatéral')->where('sexe', 'M')->count(),
            'F' => $beneficiairesAcceptes->where('cote', 'Unilatéral')->where('sexe', 'F')->count(),
        ],
        'bilateral' => [
            'M' => $beneficiairesAcceptes->where('cote', 'Bilatéral')->where('sexe', 'M')->count(),
            'F' => $beneficiairesAcceptes->where('cote', 'Bilatéral')->where('sexe', 'F')->count(),
        ],
    ];

    // Calcul du nombre total d'appareils distribués
    // Unilatéral = 1 appareil, Bilatéral = 2 appareils
    $nombreAppareilsDistribues = 
        $beneficiairesAcceptesParCote['unilateral'] + 
        ($beneficiairesAcceptesParCote['bilateral'] * 2);

    // Répartition par âge des bénéficiaires acceptés selon le côté
    $beneficiairesAcceptesUniParAge = $this->repartirParTrancheAge(
        $beneficiairesAcceptes->where('cote', 'Unilatéral')
    );
    
    $beneficiairesAcceptesBiParAge = $this->repartirParTrancheAge(
        $beneficiairesAcceptes->where('cote', 'Bilatéral')
    );

    return [
        // Données pour les participants (population cible)
        'participants_par_cote' => $participantsParCote,
        
        // Données pour tous les bénéficiaires
        'par_cote' => $beneficiairesParCote,
        
        // Données pour les bénéficiaires acceptés uniquement
        'acceptes_par_cote' => $beneficiairesAcceptesParCote,
        'acceptes_par_cote_et_sexe' => $beneficiairesAcceptesParCoteEtSexe,
        'acceptes_unilateral_par_age' => $beneficiairesAcceptesUniParAge,
        'acceptes_bilateral_par_age' => $beneficiairesAcceptesBiParAge,
        
        // Nombre total d'appareils distribués
        'nombre_appareils_distribues' => $nombreAppareilsDistribues,
        
        // Détails des appareils
        'details_appareils' => [
            'unilateral' => $beneficiairesAcceptesParCote['unilateral'], // 1 appareil chacun
            'bilateral' => $beneficiairesAcceptesParCote['bilateral'] * 2, // 2 appareils chacun
        ],
    ];
}
    /**
     * Répartir une collection par tranche d'âge
     */
    private function repartirParTrancheAge($collection)
    {
        $tranches = [
            '<15' => ['M' => 0, 'F' => 0, 'total' => 0],
            '15-64' => ['M' => 0, 'F' => 0, 'total' => 0],
            '≥65' => ['M' => 0, 'F' => 0, 'total' => 0],
        ];

        foreach ($collection as $item) {
            $age = $this->calculerAge($item->date_naissance);
            $sexe = $item->sexe === 'M' ? 'M' : 'F';

            if ($age < 15) {
                $tranches['<15'][$sexe]++;
                $tranches['<15']['total']++;
            } elseif ($age >= 65) {
                $tranches['≥65'][$sexe]++;
                $tranches['≥65']['total']++;
            } else {
                $tranches['15-64'][$sexe]++;
                $tranches['15-64']['total']++;
            }
        }

        return $tranches;
    }

    /**
     * Calculer l'âge à partir d'une date de naissance
     */
    private function calculerAge($dateNaissance)
    {
        if (!$dateNaissance) {
            return 0;
        }

        try {
            return Carbon::parse($dateNaissance)->age;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Calculer les indicateurs de performance
     */
    private function calculerIndicateurs($participants, $beneficiaires)
    {
        $totalParticipants = $participants->count();
        $totalBeneficiaires = $beneficiaires->count();
        $beneficiairesAcceptes = $beneficiaires->where('decision', 'Accepté')->count();
        $beneficiairesEnAttente = $beneficiaires->where('decision', 'En attente')->count();
        $beneficiairesRefuses = $beneficiaires->where('decision', 'Refusé')->count();

        // Taux de couverture (bénéficiaires acceptés / participants)
        $tauxCouverture = $totalParticipants > 0 
            ? round(($beneficiairesAcceptes / $totalParticipants) * 100, 2)
            : 0;

        // Taux d'acceptation (acceptés / total bénéficiaires)
        $tauxAcceptation = $totalBeneficiaires > 0
            ? round(($beneficiairesAcceptes / $totalBeneficiaires) * 100, 2)
            : 0;

        // Taux de refus
        $tauxRefus = $totalBeneficiaires > 0
            ? round(($beneficiairesRefuses / $totalBeneficiaires) * 100, 2)
            : 0;

        // Backlog (participants non encore couverts)
        $backlog = max(0, $totalParticipants - $beneficiairesAcceptes);

        // Participants confirmés (statut Oui)
        $participantsConfirmes = $participants->where('statut', 'Oui')->count();
        $tauxConfirmation = $totalParticipants > 0
            ? round(($participantsConfirmes / $totalParticipants) * 100, 2)
            : 0;

        return [
            'total_participants' => $totalParticipants,
            'total_beneficiaires' => $totalBeneficiaires,
            'beneficiaires_acceptes' => $beneficiairesAcceptes,
            'beneficiaires_en_attente' => $beneficiairesEnAttente,
            'beneficiaires_refuses' => $beneficiairesRefuses,
            'participants_confirmes' => $participantsConfirmes,
            'taux_couverture' => $tauxCouverture,
            'taux_acceptation' => $tauxAcceptation,
            'taux_refus' => $tauxRefus,
            'taux_confirmation' => $tauxConfirmation,
            'backlog' => $backlog,
        ];
    }

    /**
     * Obtenir la liste de toutes les campagnes pour le sélecteur
     */
    public function getCampagnesList()
    {
        try {
            $campagnes = Campagne::with('typeAssistance')
                ->orderBy('date_debut', 'desc')
                ->get()
                ->map(function ($campagne) {
                    return [
                        'id' => $campagne->id,
                        'nom' => $campagne->nom,
                        'type_assistance' => $campagne->typeAssistance->libelle ?? 'Non spécifié',
                        'statut' => $campagne->statut,
                        'date_debut' => $campagne->date_debut,
                        'date_fin' => $campagne->date_fin,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $campagnes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getCampagnesList', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des campagnes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques d'évolution sur plusieurs campagnes
     */
    public function getStatistiquesEvolution(Request $request)
    {
        try {
            $typeAssistanceId = $request->get('type_assistance_id');
            
            $query = Campagne::with(['typeAssistance'])
                ->orderBy('date_debut', 'asc');

            if ($typeAssistanceId) {
                $query->where('type_assistance_id', $typeAssistanceId);
            }

            $campagnes = $query->get();

            $evolution = [];

            foreach ($campagnes as $campagne) {
                $participants = Participant::where('campagne_id', $campagne->id)->count();
                $beneficiaires = Beneficiaire::where('campagne_id', $campagne->id)
                    ->where('decision', 'Accepté')
                    ->count();

                $evolution[] = [
                    'campagne' => $campagne->nom,
                    'date' => $campagne->date_debut,
                    'participants' => $participants,
                    'beneficiaires' => $beneficiaires,
                    'taux_couverture' => $participants > 0 
                        ? round(($beneficiaires / $participants) * 100, 2)
                        : 0
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $evolution
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getStatistiquesEvolution', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques d\'évolution',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter les statistiques en PDF selon le type d'assistance
     */
    public function exporterStatistiques($campagneId)
    {
        try {
            // Récupérer les données
            $response = $this->getStatistiquesCampagne($campagneId);
            $data = json_decode($response->content(), true);

            if (!$data['success']) {
                throw new \Exception('Impossible de récupérer les statistiques');
            }

            $stats = $data['data'];
            $typeAssistance = strtolower($stats['campagne']['type_assistance']);

            // Déterminer le type d'assistance
            $isLunettes = stripos($typeAssistance, 'lunette') !== false;
            $isAppareilAuditif = stripos($typeAssistance, 'auditif') !== false || 
                                 stripos($typeAssistance, 'appareil auditif') !== false;

            // Générer le PDF selon le type
            if ($isLunettes) {
                return $this->exporterStatistiquesLunettes($stats);
            } elseif ($isAppareilAuditif) {
                return $this->exporterStatistiquesAppareilAuditif($stats);
            } else {
                // Format générique si type non reconnu
                return $this->exporterStatistiquesGenerique($stats);
            }

        } catch (\Exception $e) {
            Log::error('Erreur exporterStatistiques', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter les statistiques pour les LUNETTES (Format Document 1)
     */
    private function exporterStatistiquesLunettes($stats)
    {
        try {
            $participants = $stats['participants'];
            $beneficiaires = $stats['beneficiaires'];
            $indicateurs = $stats['indicateurs'];

            // Récupérer le crédit consommé, le budget et le prix unitaire calculé dynamiquement
            $creditConsomme = $stats['campagne']['credit_consomme'];
            $budgetCampagne = $stats['campagne']['budget'];
            $prixUnitaire = $stats['campagne']['prix_unitaire'];
            $besoinsCredit2024 = $indicateurs['beneficiaires_en_attente'] * $prixUnitaire;

            $html = '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Statistiques Lunettes - ' . $stats['campagne']['nom'] . '</title>
                <style>
                    @page { margin: 20px; }
                    body { font-family: Arial, sans-serif; font-size: 11px; }
                    h2 { text-align: center; font-size: 14px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    .section-title { font-weight: bold; text-align: left; background-color: #e0e0e0; }
                    .total { font-weight: bold; background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <h2>Lunettes au titre de l\'année ' . date('Y') . ': ' . number_format($budgetCampagne, 2, ',', ' ') . ' DH</h2>
                
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">Indicateurs</th>
                            <th colspan="2">Enfants scolarisés</th>
                            <th colspan="2">Sexe</th>
                            <th colspan="3">Répartition par tranche d\'âge et sexe</th>
                            <th rowspan="2">Total des bénéficiaires</th>
                            <th rowspan="2">Nbre appareils distribués</th>
                            <th rowspan="2">Besoins en crédit (Dhs) pour ' . (date('Y') + 1) . '</th>
                            <th rowspan="2">Nombre de cas dans la liste d\'attente</th>
                        </tr>
                        <tr>
                            <th>M</th>
                            <th>F</th>
                            <th>M</th>
                            <th>F</th>
                            <th>&lt;15 ans</th>
                            <th>16-64 ans</th>
                            <th>&gt;65 ans</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="section-title">Nbre de personnes nécessitant une correction de vue</td>
                            <td>' . ($participants['par_age']['<15']['M'] ?? 0) . '</td>
                            <td>' . ($participants['par_age']['<15']['F'] ?? 0) . '</td>
                            <td>' . $participants['par_sexe']['M'] . '</td>
                            <td>' . $participants['par_sexe']['F'] . '</td>
                            <td>' . ($participants['par_age']['<15']['total'] ?? 0) . '</td>
                            <td>' . ($participants['par_age']['15-64']['total'] ?? 0) . '</td>
                            <td>' . ($participants['par_age']['≥65']['total'] ?? 0) . '</td>
                            <td class="total">' . $participants['total'] . '</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td class="section-title">Nbre de cas ayant bénéficié de lunettes</td>
                            <td>' . ($beneficiaires['enfants_scolarises']['M'] ?? 0) . '</td>
                            <td>' . ($beneficiaires['enfants_scolarises']['F'] ?? 0) . '</td>
                            <td>' . $beneficiaires['par_sexe']['M'] . '</td>
                            <td>' . $beneficiaires['par_sexe']['F'] . '</td>
                            <td>' . ($beneficiaires['par_age']['<15']['total'] ?? 0) . '</td>
                            <td>' . ($beneficiaires['par_age']['15-64']['total'] ?? 0) . '</td>
                            <td>' . ($beneficiaires['par_age']['≥65']['total'] ?? 0) . '</td>
                            <td class="total">' . $beneficiaires['total'] . '</td>
                            <td>' . $indicateurs['beneficiaires_acceptes'] . '</td>
                            <td>' . number_format($besoinsCredit2024, 2, ',', ' ') . '</td>
                            <td>' . $indicateurs['beneficiaires_en_attente'] . '</td>
                        </tr>
                        <tr>
                            <td class="section-title">Crédit consommé (Dhs) </td>
                            <td colspan="7">'. number_format($budgetCampagne, 2, ',', ' ') . ' DH</td>
                            <td colspan="4">-</td>
                        </tr>
                        <tr>
                            <td class="section-title">Prix unitaire (Dhs)</td>
                            <td colspan="7">' . number_format($prixUnitaire, 2, ',', ' ') . '</td>
                            <td colspan="4">-</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; font-size: 10px; color: #666;">
                    <p><strong>Campagne:</strong> ' . $stats['campagne']['nom'] . '</p>
                    <p><strong>Date d\'export:</strong> ' . date('d/m/Y à H:i') . '</p>
                    <p><strong>Budget campagne:</strong> ' . number_format($budgetCampagne, 2, ',', ' ') . ' DH</p>
                    <p><strong>Crédit consommé:</strong> ' . number_format($creditConsomme, 2, ',', ' ') . ' DH</p>
                    <p><strong>Prix unitaire:</strong> ' . number_format($prixUnitaire, 2, ',', ' ') . ' DH</p>
                    <p><strong>Budget disponible:</strong> ' . number_format(max(0, $budgetCampagne - $creditConsomme), 2, ',', ' ') . ' DH</p>
                    <p><strong>Taux de couverture:</strong> ' . number_format($indicateurs['taux_couverture'], 2) . '%</p>
                </div>
            </body>
            </html>';

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            $pdf->setPaper('A4', 'landscape');
            
            $fileName = 'Statistiques_Lunettes_' . str_replace(' ', '_', $stats['campagne']['nom']) . '_' . date('Y-m-d') . '.pdf';
            
            return $pdf->download($fileName);

        } catch (\Exception $e) {
            Log::error('Erreur exporterStatistiquesLunettes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Exporter les statistiques pour les APPAREILS AUDITIFS (Format Document 2) - AMÉLIORÉ
     */
    private function exporterStatistiquesAppareilAuditif($stats)
    {
        try {
            $participants = $stats['participants'];
            $beneficiaires = $stats['beneficiaires'];
            $indicateurs = $stats['indicateurs'];
            $auditifs = $stats['auditifs'] ?? [
                'participants_par_cote' => ['unilateral' => 0, 'bilateral' => 0],
                'acceptes_par_cote' => ['unilateral' => 0, 'bilateral' => 0],
                'nombre_appareils_distribues' => 0
            ];

            // Récupérer le crédit consommé, le budget et le prix unitaire
            $creditConsomme = $stats['campagne']['credit_consomme'];
            $budgetCampagne = $stats['campagne']['budget'];
            $prixUnitaire = $stats['campagne']['prix_unitaire'];
            $besoinsCredit2024 = $indicateurs['beneficiaires_en_attente'] * $prixUnitaire;

            // Utiliser les vraies données des participants et bénéficiaires acceptés
            $participantsUnilateral = $auditifs['participants_par_cote']['unilateral'] ?? 0;
            $participantsBilateral = $auditifs['participants_par_cote']['bilateral'] ?? 0;
            
            $beneficiairesUnilateral = $auditifs['acceptes_par_cote']['unilateral'] ?? 0;
            $beneficiairesBilateral = $auditifs['acceptes_par_cote']['bilateral'] ?? 0;
            
            // Nombre d'appareils distribués (calculé correctement)
            $nbAppareils = $auditifs['nombre_appareils_distribues'] ?? 
                          ($beneficiairesUnilateral + ($beneficiairesBilateral * 2));

            $html = '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Statistiques Appareils Auditifs - ' . $stats['campagne']['nom'] . '</title>
                <style>
                    @page { margin: 20px; }
                    body { font-family: Arial, sans-serif; font-size: 11px; }
                    h2 { text-align: center; font-size: 14px; margin-bottom: 10px; }
                    .subtitle { text-align: center; font-size: 12px; margin-bottom: 20px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    .section-title { font-weight: bold; text-align: left; background-color: #e0e0e0; }
                    .total { font-weight: bold; background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <h2>COMPAGNE DE LUTTE CONTRE LE HANDICAP AUDITIF ET VISUEL: ' . number_format($budgetCampagne, 2, ',', ' ') . ' DH</h2>
                <p class="subtitle">Appareils auditifs au titre de l\'année ' . date('Y') . ': ' . number_format($creditConsomme, 2, ',', ' ') . ' DH</p>
                
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">Indicateurs</th>
                            <th rowspan="2">Unilatérale</th>
                            <th rowspan="2">Bilatérale</th>
                            <th colspan="2">Sexe</th>
                            <th colspan="3">Répartition par tranche d\'âge</th>
                            <th rowspan="2">Total des bénéficiaires</th>
                            <th rowspan="2">Nbre appareils distribués</th>
                            <th rowspan="2">Besoins en crédit (Dhs) pour ' . (date('Y') + 1) . '</th>
                            <th rowspan="2">Nombre de cas dans la liste d\'attente</th>
                        </tr>
                        <tr>
                            <th>M</th>
                            <th>F</th>
                            <th>&lt;15 ans</th>
                            <th>16-64 ans</th>
                            <th>&gt;65 ans</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="section-title">Nbre de cas de perte de perception d\'audition</td>
                            <td>' . $participantsUnilateral . '</td>
                            <td>' . $participantsBilateral . '</td>
                            <td>' . $participants['par_sexe']['M'] . '</td>
                            <td>' . $participants['par_sexe']['F'] . '</td>
                            <td>' . ($participants['par_age']['<15']['total'] ?? 0) . '</td>
                            <td>' . ($participants['par_age']['15-64']['total'] ?? 0) . '</td>
                            <td>' . ($participants['par_age']['≥65']['total'] ?? 0) . '</td>
                            <td class="total">' . $participants['total'] . '</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td class="section-title">Nbre de cas ayant bénéficié d\'audioprothèse</td>
                            <td>' . $beneficiairesUnilateral . '</td>
                            <td>' . $beneficiairesBilateral . '</td>
                            <td>' . $beneficiaires['par_sexe']['M'] . '</td>
                            <td>' . $beneficiaires['par_sexe']['F'] . '</td>
                            <td>' . ($beneficiaires['par_age']['<15']['total'] ?? 0) . '</td>
                            <td>' . ($beneficiaires['par_age']['15-64']['total'] ?? 0) . '</td>
                            <td>' . ($beneficiaires['par_age']['≥65']['total'] ?? 0) . '</td>
                            <td class="total">' . $indicateurs['beneficiaires_acceptes'] . '</td>
                            <td class="total">' . $nbAppareils . '</td>
                            <td>' . number_format($besoinsCredit2024, 2, ',', ' ') . '</td>
                            <td>' . $indicateurs['beneficiaires_en_attente'] . '</td>
                        </tr>
                        <tr>
                            <td class="section-title">Crédit consommé (Dhs) </td>
                            <td colspan="7">'  . number_format($budgetCampagne, 2, ',', ' ') . ' DH</td>
                            <td colspan="4">-</td>
                        </tr>
                        <tr>
                            <td class="section-title">Prix unitaire (Dhs)</td>
                            <td colspan="7">' . number_format($prixUnitaire, 2, ',', ' ') . '</td>
                            <td colspan="4">-</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; font-size: 10px; color: #666;">
                    <p><strong>Campagne:</strong> ' . $stats['campagne']['nom'] . '</p>
                    <p><strong>Date d\'export:</strong> ' . date('d/m/Y à H:i') . '</p>
                    <p><strong>Budget campagne:</strong> ' . number_format($budgetCampagne, 2, ',', ' ') . ' DH</p>
                    <p><strong>Crédit consommé:</strong> ' . number_format($creditConsomme, 2, ',', ' ') . ' DH</p>
                    <p><strong>Prix unitaire:</strong> ' . number_format($prixUnitaire, 2, ',', ' ') . ' DH</p>
                    <p><strong>Budget disponible:</strong> ' . number_format(max(0, $budgetCampagne - $creditConsomme), 2, ',', ' ') . ' DH</p>
                    <p><strong>Taux de couverture:</strong> ' . number_format($indicateurs['taux_couverture'], 2) . '%</p>
                    <p><strong>Détails appareils distribués:</strong></p>
                    <p style="margin-left: 20px;">- Unilatéral: ' . $beneficiairesUnilateral . ' personnes × 1 appareil = ' . $beneficiairesUnilateral . ' appareils</p>
                    <p style="margin-left: 20px;">- Bilatéral: ' . $beneficiairesBilateral . ' personnes × 2 appareils = ' . ($beneficiairesBilateral * 2) . ' appareils</p>
                    <p style="margin-left: 20px;">- <strong>Total: ' . $nbAppareils . ' appareils distribués</strong></p>
                </div>
            </body>
            </html>';

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            $pdf->setPaper('A4', 'landscape');
            
            $fileName = 'Statistiques_Appareils_Auditifs_' . str_replace(' ', '_', $stats['campagne']['nom']) . '_' . date('Y-m-d') . '.pdf';
            
            return $pdf->download($fileName);

        } catch (\Exception $e) {
            Log::error('Erreur exporterStatistiquesAppareilAuditif', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Exporter les statistiques au format générique (si type non reconnu)
     */
    private function exporterStatistiquesGenerique($stats)
    {
        try {
            $participants = $stats['participants'];
            $beneficiaires = $stats['beneficiaires'];
            $indicateurs = $stats['indicateurs'];

            // Récupérer le crédit consommé, le budget et le prix unitaire
            $creditConsomme = $stats['campagne']['credit_consomme'];
            $budgetCampagne = $stats['campagne']['budget'];
            $prixUnitaire = $stats['campagne']['prix_unitaire'];

            $html = '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Statistiques - ' . $stats['campagne']['nom'] . '</title>
                <style>
                    @page { margin: 30px; }
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    h1 { text-align: center; color: #333; }
                    h2 { color: #666; margin-top: 30px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    .highlight { background-color: #e6f3ff; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Statistiques - ' . $stats['campagne']['nom'] . '</h1>
                <p><strong>Type d\'assistance:</strong> ' . $stats['campagne']['type_assistance'] . '</p>
                <p><strong>Budget:</strong> ' . number_format($budgetCampagne, 2, ',', ' ') . ' DH</p>
                <p><strong>Date d\'export:</strong> ' . date('d/m/Y à H:i') . '</p>
                
                <h2>Indicateurs Financiers</h2>
                <table>
                    <tr><th>Indicateur</th><th>Valeur</th></tr>
                    <tr><td>Budget Campagne</td><td class="highlight">' . number_format($budgetCampagne, 2, ',', ' ') . ' DH</td></tr>
                    <tr><td>Crédit Consommé</td><td class="highlight">' . number_format($creditConsomme, 2, ',', ' ') . ' DH</td></tr>
                    <tr><td>Prix Unitaire</td><td class="highlight">' . number_format($prixUnitaire, 2, ',', ' ') . ' DH</td></tr>
                    <tr><td>Budget Disponible</td><td class="highlight">' . number_format(max(0, $budgetCampagne - $creditConsomme), 2, ',', ' ') . ' DH</td></tr>
                    <tr><td>Taux Utilisation</td><td>' . ($budgetCampagne > 0 ? number_format(($creditConsomme / $budgetCampagne) * 100, 2) : 0) . '%</td></tr>
                </table>
                
                <h2>Indicateurs Clés</h2>
                <table>
                    <tr><th>Indicateur</th><th>Valeur</th></tr>
                    <tr><td>Total Participants</td><td class="highlight">' . number_format($indicateurs['total_participants']) . '</td></tr>
                    <tr><td>Bénéficiaires Acceptés</td><td class="highlight">' . number_format($indicateurs['beneficiaires_acceptes']) . '</td></tr>
                    <tr><td>Taux de Couverture</td><td class="highlight">' . number_format($indicateurs['taux_couverture'], 2) . '%</td></tr>
                    <tr><td>En Attente</td><td>' . number_format($indicateurs['beneficiaires_en_attente']) . '</td></tr>
                    <tr><td>Backlog</td><td>' . number_format($indicateurs['backlog']) . '</td></tr>
                </table>
                
                <h2>Participants</h2>
                <table>
                    <tr><th>Catégorie</th><th>Hommes</th><th>Femmes</th><th>Total</th></tr>
                    <tr>
                        <td>&lt;15 ans</td>
                        <td>' . ($participants['par_age']['<15']['M'] ?? 0) . '</td>
                        <td>' . ($participants['par_age']['<15']['F'] ?? 0) . '</td>
                        <td class="highlight">' . ($participants['par_age']['<15']['total'] ?? 0) . '</td>
                    </tr>
                    <tr>
                        <td>15-64 ans</td>
                        <td>' . ($participants['par_age']['15-64']['M'] ?? 0) . '</td>
                        <td>' . ($participants['par_age']['15-64']['F'] ?? 0) . '</td>
                        <td class="highlight">' . ($participants['par_age']['15-64']['total'] ?? 0) . '</td>
                    </tr>
                    <tr>
                        <td>≥65 ans</td>
                        <td>' . ($participants['par_age']['≥65']['M'] ?? 0) . '</td>
                        <td>' . ($participants['par_age']['≥65']['F'] ?? 0) . '</td>
                        <td class="highlight">' . ($participants['par_age']['≥65']['total'] ?? 0) . '</td>
                    </tr>
                    <tr class="highlight">
                        <td><strong>TOTAL</strong></td>
                        <td><strong>' . $participants['par_sexe']['M'] . '</strong></td>
                        <td><strong>' . $participants['par_sexe']['F'] . '</strong></td>
                        <td><strong>' . $participants['total'] . '</strong></td>
                    </tr>
                </table>
                
                <h2>Bénéficiaires</h2>
                <table>
                    <tr><th>Catégorie</th><th>Hommes</th><th>Femmes</th><th>Total</th></tr>
                    <tr>
                        <td>&lt;15 ans</td>
                        <td>' . ($beneficiaires['par_age']['<15']['M'] ?? 0) . '</td>
                        <td>' . ($beneficiaires['par_age']['<15']['F'] ?? 0) . '</td>
                        <td class="highlight">' . ($beneficiaires['par_age']['<15']['total'] ?? 0) . '</td>
                    </tr>
                    <tr>
                        <td>15-64 ans</td>
                        <td>' . ($beneficiaires['par_age']['15-64']['M'] ?? 0) . '</td>
                        <td>' . ($beneficiaires['par_age']['15-64']['F'] ?? 0) . '</td>
                        <td class="highlight">' . ($beneficiaires['par_age']['15-64']['total'] ?? 0) . '</td>
                    </tr>
                    <tr>
                        <td>≥65 ans</td>
                        <td>' . ($beneficiaires['par_age']['≥65']['M'] ?? 0) . '</td>
                        <td>' . ($beneficiaires['par_age']['≥65']['F'] ?? 0) . '</td>
                        <td class="highlight">' . ($beneficiaires['par_age']['≥65']['total'] ?? 0) . '</td>
                    </tr>
                    <tr class="highlight">
                        <td><strong>TOTAL</strong></td>
                        <td><strong>' . $beneficiaires['par_sexe']['M'] . '</strong></td>
                        <td><strong>' . $beneficiaires['par_sexe']['F'] . '</strong></td>
                        <td><strong>' . $beneficiaires['total'] . '</strong></td>
                    </tr>
                </table>
            </body>
            </html>';

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            $pdf->setPaper('A4', 'portrait');
            
            $fileName = 'Statistiques_' . str_replace(' ', '_', $stats['campagne']['nom']) . '_' . date('Y-m-d') . '.pdf';
            
            return $pdf->download($fileName);

        } catch (\Exception $e) {
            Log::error('Erreur exporterStatistiquesGenerique', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}