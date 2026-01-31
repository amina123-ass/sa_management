<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use App\Models\Campagne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Style\Protection;

class ReceptionController extends Controller
{
    /**
     * Nom du fichier Canva fixe
     */
    const CANVA_FILENAME = 'liste_des_participants.xlsx';
    const CANVA_FILEPATH = 'participants/liste_des_participants.xlsx';

    /**
     * Générer et télécharger le fichier Canva Excel avec fonctionnalités avancées
     * VERSION AMÉLIORÉE avec listes déroulantes (Sexe, Statut, Commune) et validations
     */
    public function genererCanva($campagneId)
    {
        try {
            Log::info('=== DÉBUT GÉNÉRATION CANVA AMÉLIORÉ ===', [
                'campagne_id' => $campagneId,
                'timestamp' => now()->toDateTimeString()
            ]);

            // 1. Récupérer la campagne
            $campagne = Campagne::with('typeAssistance')->findOrFail($campagneId);
            
            Log::info('Campagne trouvée', [
                'campagne_nom' => $campagne->nom,
                'type_assistance' => $campagne->typeAssistance?->libelle
            ]);

            // 2. Récupérer les participants en attente des campagnes précédentes
            $participantsEnAttente = Participant::whereHas('campagne', function ($query) use ($campagne) {
                $query->where('type_assistance_id', $campagne->type_assistance_id)
                      ->where('date_fin', '<', now())
                      ->where('id', '!=', $campagne->id);
            })
            ->where('statut', 'En attente')
            ->with(['commune'])
            ->get();

            Log::info('Participants récupérés', [
                'count' => $participantsEnAttente->count()
            ]);

            // 3. Créer le fichier Excel
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Participants');

            // 4. TITRE DE LA FEUILLE (Ligne 1)
            $sheet->mergeCells('A1:L1');
            $sheet->setCellValue('A1', 'LISTE DES PARTICIPANTS - ' . strtoupper($campagne->nom));
            $sheet->getStyle('A1')->getFont()
                ->setBold(true)
                ->setSize(14)
                ->getColor()->setARGB('FFFFFF');
            $sheet->getStyle('A1')->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB('1F4E78');
            $sheet->getStyle('A1')->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getRowDimension(1)->setRowHeight(30);

            // 5. EN-TÊTES DES COLONNES (Ligne 2)
            $headers = [
                'A2' => 'CIN',
                'B2' => 'Nom',
                'C2' => 'Prénom',
                'D2' => 'Date de naissance',
                'E2' => 'Sexe',
                'F2' => 'Téléphone',
                'G2' => 'Email',
                'H2' => 'Adresse',
                'I2' => 'Commune',
                'J2' => 'Statut',
                'K2' => 'Date appel',
                'L2' => 'Observation',
            ];

            foreach ($headers as $cell => $value) {
                $sheet->setCellValue($cell, $value);
            }

            // Style des en-têtes
            $sheet->getStyle('A2:L2')->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['argb' => 'FFFFFF'],
                    'size' => 11
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => '4472C4']
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => '000000']
                    ]
                ]
            ]);
            $sheet->getRowDimension(2)->setRowHeight(25);

            Log::info('En-têtes créés avec style avancé');

            // 6. REMPLIR LES DONNÉES
            $row = 3; // Commencer à la ligne 3 (après titre et en-têtes)
            foreach ($participantsEnAttente as $participant) {
                $sheet->setCellValue('A' . $row, $participant->cin);
                $sheet->setCellValue('B' . $row, $participant->nom);
                $sheet->setCellValue('C' . $row, $participant->prenom);
                $sheet->setCellValue('D' . $row, $participant->date_naissance->format('d/m/Y'));
                $sheet->setCellValue('E' . $row, $participant->sexe);
                $sheet->setCellValue('F' . $row, $participant->telephone);
                $sheet->setCellValue('G' . $row, $participant->email ?? '');
                $sheet->setCellValue('H' . $row, $participant->adresse);
                $sheet->setCellValue('I' . $row, $participant->commune?->nom ?? '');
                $sheet->setCellValue('J' . $row, 'En attente');
                $sheet->setCellValue('K' . $row, '');
                $sheet->setCellValue('L' . $row, '');
                
                // Style alterné pour les lignes
                if ($row % 2 == 0) {
                    $sheet->getStyle('A' . $row . ':L' . $row)->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setARGB('F2F2F2');
                }
                
                // Bordures pour chaque ligne
                $sheet->getStyle('A' . $row . ':L' . $row)->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN)
                    ->getColor()->setARGB('D3D3D3');
                
                $row++;
            }

            $lastDataRow = $row - 1;
            Log::info('Données remplies', ['rows_count' => $lastDataRow - 2]);

            // 7. AJOUTER DES LIGNES VIDES POUR LA SAISIE (20 lignes supplémentaires)
            $extraRows = 20;
            for ($i = 0; $i < $extraRows; $i++) {
                if ($row % 2 == 0) {
                    $sheet->getStyle('A' . $row . ':L' . $row)->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setARGB('F2F2F2');
                }
                $sheet->getStyle('A' . $row . ':L' . $row)->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN)
                    ->getColor()->setARGB('D3D3D3');
                $row++;
            }
            $lastRow = $row - 1;

            // 8. LISTE DES COMMUNES (pour la validation)
            $communes = [
                'Dar alhamra',
                'Adrej',
                'Ighezrane',
                'Imouzer',
                'Kander',
                'Bhalil',
                'El menzel',
                'Ait Sbaa lajrouf',
                'Oulad Mkoudou',
                'Mternagha',
                'Ain timgnay',
                'Sidi Lahcen',
                'Tazouta',
                'Ribat Lkhir',
                'Ain chegag',
                'Azzaba',
                'Aghbalou akourar',
                'Sidi youssef ben ahmed',
                'Sefrou',
                'Laanoucer',
                'Sidi khiar',
                'Ras Tbouda',
                'Bir Tam Tam'
            ];

            // Créer une feuille cachée pour stocker la liste des communes
            $communesSheet = $spreadsheet->createSheet();
            $communesSheet->setTitle('Liste_Communes');
            
            // Remplir la liste des communes dans la feuille cachée
            foreach ($communes as $index => $commune) {
                $communesSheet->setCellValue('A' . ($index + 1), $commune);
            }
            
            // Cacher la feuille des communes
            $communesSheet->setSheetState(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet::SHEETSTATE_HIDDEN);

            // Revenir à la feuille principale
            $spreadsheet->setActiveSheetIndex(0);
            $sheet = $spreadsheet->getActiveSheet();

            // 9. LISTE DÉROULANTE POUR SEXE (Colonne E)
            for ($r = 3; $r <= $lastRow; $r++) {
                $validation = $sheet->getCell('E' . $r)->getDataValidation();
                $validation->setType(DataValidation::TYPE_LIST);
                $validation->setErrorStyle(DataValidation::STYLE_STOP);
                $validation->setAllowBlank(false);
                $validation->setShowInputMessage(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowDropDown(true);
                $validation->setErrorTitle('Valeur invalide');
                $validation->setError('Veuillez sélectionner M ou F');
                $validation->setPromptTitle('Sexe');
                $validation->setPrompt('Sélectionnez M (Masculin) ou F (Féminin)');
                $validation->setFormula1('"M,F"');
            }

            // 10. LISTE DÉROULANTE POUR COMMUNE (Colonne I)
            $communesCount = count($communes);
            for ($r = 3; $r <= $lastRow; $r++) {
                $validation = $sheet->getCell('I' . $r)->getDataValidation();
                $validation->setType(DataValidation::TYPE_LIST);
                $validation->setErrorStyle(DataValidation::STYLE_STOP);
                $validation->setAllowBlank(true); // Permettre les valeurs vides
                $validation->setShowInputMessage(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowDropDown(true);
                $validation->setErrorTitle('Commune invalide');
                $validation->setError('Veuillez sélectionner une commune dans la liste');
                $validation->setPromptTitle('Commune');
                $validation->setPrompt('Sélectionnez la commune du participant');
                // Référence à la feuille cachée
                $validation->setFormula1('Liste_Communes!$A$1:$A$' . $communesCount);
            }

            // 11. LISTE DÉROULANTE POUR STATUT (Colonne J)
            for ($r = 3; $r <= $lastRow; $r++) {
                $validation = $sheet->getCell('J' . $r)->getDataValidation();
                $validation->setType(DataValidation::TYPE_LIST);
                $validation->setErrorStyle(DataValidation::STYLE_STOP);
                $validation->setAllowBlank(false);
                $validation->setShowInputMessage(true);
                $validation->setShowErrorMessage(true);
                $validation->setShowDropDown(true);
                $validation->setErrorTitle('Valeur invalide');
                $validation->setError('Veuillez sélectionner un statut valide');
                $validation->setPromptTitle('Statut');
                $validation->setPrompt('Sélectionnez le statut du participant');
                $validation->setFormula1('"En attente,Oui,Non"');
            }

            // 12. FORMAT DE DATE POUR "Date appel" (Colonne K)
            $sheet->getStyle('K3:K' . $lastRow)
                ->getNumberFormat()
                ->setFormatCode(NumberFormat::FORMAT_DATE_DDMMYYYY);

            // 13. VALIDATION DE DATE pour "Date de naissance" (Colonne D)
            $sheet->getStyle('D3:D' . $lastRow)
                ->getNumberFormat()
                ->setFormatCode(NumberFormat::FORMAT_DATE_DDMMYYYY);

            // 14. FORMAT TEXTE pour CIN (Colonne A) - éviter conversion en nombre
            $sheet->getStyle('A3:A' . $lastRow)
                ->getNumberFormat()
                ->setFormatCode(NumberFormat::FORMAT_TEXT);

            // 15. FORMAT TEXTE pour Téléphone (Colonne F)
            $sheet->getStyle('F3:F' . $lastRow)
                ->getNumberFormat()
                ->setFormatCode(NumberFormat::FORMAT_TEXT);

            // 16. ALIGNEMENT DES COLONNES
            $sheet->getStyle('A3:L' . $lastRow)->getAlignment()
                ->setVertical(Alignment::VERTICAL_CENTER);
            
            // Centrer : Sexe, Statut
            $sheet->getStyle('E3:E' . $lastRow)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('J3:J' . $lastRow)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // 17. AUTO-SIZE DES COLONNES
            $columnWidths = [
                'A' => 15,  // CIN
                'B' => 20,  // Nom
                'C' => 20,  // Prénom
                'D' => 18,  // Date naissance
                'E' => 8,   // Sexe
                'F' => 15,  // Téléphone
                'G' => 25,  // Email
                'H' => 35,  // Adresse
                'I' => 22,  // Commune (plus large pour les noms longs)
                'J' => 12,  // Statut
                'K' => 15,  // Date appel
                'L' => 30,  // Observation
            ];

            foreach ($columnWidths as $col => $width) {
                $sheet->getColumnDimension($col)->setWidth($width);
            }

            // 18. PROTECTION DE LA FEUILLE (Optionnel)
            // Les utilisateurs peuvent modifier uniquement certaines cellules
            // Déverrouiller les cellules éditables
            $sheet->getStyle('A3:L' . $lastRow)->getProtection()
                ->setLocked(Protection::PROTECTION_UNPROTECTED);
            
            // Protéger le titre et les en-têtes
            $sheet->getStyle('A1:L2')->getProtection()
                ->setLocked(Protection::PROTECTION_PROTECTED);

            // 19. INFORMATIONS SUPPLÉMENTAIRES (Footer)
            $infoRow = $lastRow + 2;
            $sheet->mergeCells('A' . $infoRow . ':L' . $infoRow);
            $sheet->setCellValue('A' . $infoRow, 
                'INSTRUCTIONS : Remplissez uniquement les cellules vides. ' .
                'Utilisez les listes déroulantes pour Sexe, Commune et Statut. ' .
                'Format des dates : JJ/MM/AAAA. ' .
                'Généré le ' . now()->format('d/m/Y à H:i')
            );
            $sheet->getStyle('A' . $infoRow)->getFont()
                ->setSize(9)
                ->setItalic(true)
                ->getColor()->setARGB('666666');
            $sheet->getStyle('A' . $infoRow)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setWrapText(true);

            // Ajouter une note sur les communes
            $infoRow2 = $infoRow + 1;
            $sheet->mergeCells('A' . $infoRow2 . ':L' . $infoRow2);
            $sheet->setCellValue('A' . $infoRow2, 
                'COMMUNES DISPONIBLES : ' . implode(', ', $communes)
            );
            $sheet->getStyle('A' . $infoRow2)->getFont()
                ->setSize(8)
                ->setItalic(true)
                ->getColor()->setARGB('888888');
            $sheet->getStyle('A' . $infoRow2)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                ->setWrapText(true);
            $sheet->getRowDimension($infoRow2)->setRowHeight(40);

            Log::info('Formatage et validations appliqués', [
                'communes_count' => count($communes),
                'validations' => ['Sexe (M/F)', 'Commune (' . count($communes) . ' options)', 'Statut (En attente/Oui/Non)']
            ]);

            // 20. Obtenir le chemin complet de sauvegarde
            $fullPath = storage_path('app/' . self::CANVA_FILEPATH);
            
            Log::info('Préparation de la sauvegarde', [
                'full_path' => $fullPath,
                'directory' => dirname($fullPath)
            ]);

            // 21. S'assurer que le dossier existe
            $directory = dirname($fullPath);
            if (!is_dir($directory)) {
                Log::info('Création du dossier participants');
                mkdir($directory, 0755, true);
            }

            // 22. Sauvegarder le fichier directement
            $writer = new Xlsx($spreadsheet);
            $writer->save($fullPath);

            // 23. Vérifier que le fichier a bien été créé
            $fileExists = file_exists($fullPath);
            $fileSize = $fileExists ? filesize($fullPath) : 0;

            Log::info('Fichier Canva amélioré sauvegardé', [
                'file_exists' => $fileExists,
                'file_size' => $fileSize,
                'file_readable' => is_readable($fullPath)
            ]);

            if (!$fileExists) {
                throw new \Exception('Le fichier n\'a pas été créé : ' . $fullPath);
            }

            if ($fileSize === 0) {
                throw new \Exception('Le fichier créé est vide (0 bytes)');
            }

            Log::info('=== GÉNÉRATION CANVA AMÉLIORÉ RÉUSSIE ===', [
                'file_path' => $fullPath,
                'file_size' => number_format($fileSize) . ' bytes',
                'participants_count' => $participantsEnAttente->count(),
                'total_rows_with_validation' => $lastRow - 2,
                'communes_available' => count($communes)
            ]);

            // 24. Retourner le fichier pour téléchargement
            return response()->download($fullPath, self::CANVA_FILENAME, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . self::CANVA_FILENAME . '"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ])->deleteFileAfterSend(false);

        } catch (\Exception $e) {
            Log::error('=== ERREUR GÉNÉRATION CANVA AMÉLIORÉ ===', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'campagne_id' => $campagneId,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du fichier Canva',
                'error' => $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    /**
     * Liste des participants d'une campagne
     */
    public function getParticipants(Request $request, $campagneId)
    {
        try {
            $query = Participant::where('campagne_id', $campagneId)
                ->with(['commune', 'createdBy', 'updatedBy']);

            if ($request->has('statut') && $request->statut !== '') {
                $query->where('statut', $request->statut);
            }

            if ($request->has('appel_effectue')) {
                $query->where('appel_effectue', $request->appel_effectue);
            }

            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('cin', 'like', "%{$search}%")
                      ->orWhere('telephone', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $participants = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $participants
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getParticipants', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un participant
     */
    public function storeParticipant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'campagne_id' => 'required|exists:campagnes,id',
            'commune_id' => 'nullable|exists:communes,id',
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'cin' => 'required|string|max:20|unique:participants,cin',
            'date_naissance' => 'required|date',
            'sexe' => 'required|in:M,F',
            'telephone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'adresse' => 'required|string',
            'statut' => 'nullable|in:En attente,Oui,Non',
            'date_appel' => 'nullable|date',
            'observation_appel' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            $data['created_by'] = auth()->id();
            $data['statut'] = $data['statut'] ?? 'En attente';

            $participant = Participant::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Participant ajouté avec succès',
                'data' => $participant->load(['campagne', 'commune'])
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur storeParticipant', [
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout du participant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Modifier un participant
     */
    public function updateParticipant(Request $request, $id)
    {
        $participant = Participant::find($id);

        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'Participant non trouvé'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'commune_id' => 'nullable|exists:communes,id',
            'nom' => 'sometimes|required|string|max:255',
            'prenom' => 'sometimes|required|string|max:255',
            'cin' => 'sometimes|required|string|max:20|unique:participants,cin,' . $id,
            'date_naissance' => 'sometimes|required|date',
            'sexe' => 'sometimes|required|in:M,F',
            'telephone' => 'sometimes|required|string|max:20',
            'email' => 'nullable|email|max:255',
            'adresse' => 'sometimes|required|string',
            'statut' => 'nullable|in:En attente,Oui,Non',
            'date_appel' => 'nullable|date',
            'appel_effectue' => 'nullable|boolean',
            'observation_appel' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            $data['updated_by'] = auth()->id();

            $participant->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Participant mis à jour avec succès',
                'data' => $participant->load(['campagne', 'commune'])
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur updateParticipant', [
                'error' => $e->getMessage(),
                'id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un participant
     */
    public function deleteParticipant($id)
    {
        try {
            $participant = Participant::find($id);

            if (!$participant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Participant non trouvé'
                ], 404);
            }

            $participant->delete();

            return response()->json([
                'success' => true,
                'message' => 'Participant supprimé avec succès'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur deleteParticipant', [
                'error' => $e->getMessage(),
                'id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Importer les participants depuis Excel
     * VERSION CORRIGÉE - ignore les lignes d'instructions du footer
     */
    public function importerParticipants(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'campagne_id' => 'required|exists:campagnes,id',
            'fichier' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $campagneId = $request->campagne_id;
            $file = $request->file('fichier');

            Log::info('=== DÉBUT IMPORT PARTICIPANTS ===', [
                'campagne_id' => $campagneId,
                'fichier' => $file->getClientOriginalName()
            ]);

            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            Log::info('Fichier Excel chargé', ['total_rows' => count($rows)]);

            // Retirer les 2 premières lignes (titre + en-têtes)
            array_shift($rows); // Titre
            array_shift($rows); // En-têtes

            $imported = 0;
            $updated = 0;
            $errors = [];
            $skipped = 0;

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 3; // +3 car on a supprimé 2 lignes

                // Ignorer les lignes complètement vides
                if (empty($row[0]) || trim($row[0]) === '') {
                    continue;
                }

                $cin = trim($row[0]);
                
                // ⚠️ CORRECTION PRINCIPALE : Arrêter l'import si on atteint les lignes d'instructions
                // Ces lignes commencent par "INSTRUCTIONS" ou "COMMUNES DISPONIBLES"
                if (stripos($cin, 'INSTRUCTIONS') === 0 || stripos($cin, 'COMMUNES') === 0) {
                    Log::info('Import arrêté : ligne d\'instructions détectée', [
                        'row' => $rowNumber,
                        'cin_value' => substr($cin, 0, 50) . '...'
                    ]);
                    break; // Arrêter complètement l'import
                }
                
                // Vérifier que le CIN a une longueur valide
                if (strlen($cin) > 20) {
                    $errors[] = "Ligne {$rowNumber}: CIN trop long (max 20 caractères)";
                    $skipped++;
                    continue;
                }
                
                // Vérifier que les champs obligatoires sont présents
                if (empty(trim($row[1])) || empty(trim($row[2]))) {
                    $errors[] = "Ligne {$rowNumber}: Nom ou prénom manquant";
                    $skipped++;
                    continue;
                }
                
                // Vérifier qu'il y a une date de naissance
                if (empty($row[3])) {
                    $errors[] = "Ligne {$rowNumber}: Date de naissance manquante";
                    $skipped++;
                    continue;
                }

                $existingParticipant = Participant::where('cin', $cin)->first();

                // Convertir les dates Excel en format PHP
                $dateNaissance = null;
                try {
                    // Si c'est un nombre Excel (format date Excel)
                    if (is_numeric($row[3])) {
                        $dateNaissance = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row[3])->format('Y-m-d');
                    } else {
                        $dateNaissance = Carbon::parse($row[3])->format('Y-m-d');
                    }
                } catch (\Exception $e) {
                    $errors[] = "Ligne {$rowNumber}: Format de date de naissance invalide";
                    $skipped++;
                    continue;
                }

                $dateAppel = null;
                if (!empty($row[10])) {
                    try {
                        if (is_numeric($row[10])) {
                            $dateAppel = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row[10])->format('Y-m-d');
                        } else {
                            $dateAppel = Carbon::parse($row[10])->format('Y-m-d');
                        }
                    } catch (\Exception $e) {
                        // Date appel optionnelle, on continue sans erreur
                        Log::warning("Ligne {$rowNumber}: Format de date d'appel invalide, ignorée");
                    }
                }

                $participantData = [
                    'campagne_id' => $campagneId,
                    'cin' => $cin,
                    'nom' => trim($row[1] ?? ''),
                    'prenom' => trim($row[2] ?? ''),
                    'date_naissance' => $dateNaissance,
                    'sexe' => strtoupper(trim($row[4] ?? 'M')),
                    'telephone' => trim($row[5] ?? ''),
                    'email' => !empty($row[6]) ? trim($row[6]) : null,
                    'adresse' => trim($row[7] ?? ''),
                    'statut' => trim($row[9] ?? 'En attente'),
                    'date_appel' => $dateAppel,
                    'observation_appel' => !empty($row[11]) ? trim($row[11]) : null,
                ];

                // Rechercher la commune
                if (!empty($row[8])) {
                    $commune = \App\Models\Commune::where('nom', 'like', '%' . trim($row[8]) . '%')->first();
                    $participantData['commune_id'] = $commune?->id;
                }

                try {
                    if ($existingParticipant) {
                        $participantData['updated_by'] = auth()->id();
                        $existingParticipant->update($participantData);
                        $updated++;
                        Log::info("Ligne {$rowNumber}: Participant mis à jour", ['cin' => $cin]);
                    } else {
                        $participantData['created_by'] = auth()->id();
                        Participant::create($participantData);
                        $imported++;
                        Log::info("Ligne {$rowNumber}: Nouveau participant créé", ['cin' => $cin]);
                    }
                } catch (\Exception $e) {
                    $errorMsg = "Ligne {$rowNumber}: " . $e->getMessage();
                    $errors[] = $errorMsg;
                    $skipped++;
                    Log::error('Erreur insertion participant', [
                        'row' => $rowNumber,
                        'cin' => $cin,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('=== FIN IMPORT PARTICIPANTS ===', [
                'imported' => $imported,
                'updated' => $updated,
                'skipped' => $skipped,
                'errors_count' => count($errors)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Import terminé avec succès',
                'data' => [
                    'imported' => $imported,
                    'updated' => $updated,
                    'skipped' => $skipped,
                    'errors' => $errors
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur importerParticipants', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'import',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer une convocation PDF
     */
    public function genererConvocation($id)
    {
        try {
            // Récupérer le participant avec ses relations
            $participant = Participant::with(['campagne.typeAssistance', 'commune'])
                ->findOrFail($id);

            // Vérifier que le participant est confirmé (statut = "Oui")
            if ($participant->statut !== 'Oui') {
                return response()->json([
                    'message' => 'Ce participant n\'est pas confirmé. Seuls les participants confirmés peuvent recevoir une convocation.'
                ], 400);
            }

            // Charger la vue et générer le PDF
            $pdf = Pdf::loadView('pdf.convocation', [
                'participant' => $participant
            ]);

            // Configuration pour format A4 portrait
            $pdf->setPaper('A4', 'portrait');
            
            // Options supplémentaires pour optimisation A4
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'dpi' => 96,
                'enable_php' => false,
                'chroot' => public_path(),
            ]);

            // Nom du fichier
            $filename = 'Convocation_' . 
                        $participant->nom . '_' . 
                        $participant->prenom . '_' . 
                        date('Y-m-d') . '.pdf';

            // Télécharger le PDF
            return $pdf->download($filename);

        } catch (\Exception $e) {
            \Log::error('Erreur génération convocation: ' . $e->getMessage(), [
                'participant_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la génération de la convocation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function genererConvocationsMultiples(Request $request)
    {
        $request->validate([
            'participant_ids' => 'required|array',
            'participant_ids.*' => 'exists:participants,id'
        ]);

        try {
            $zip = new \ZipArchive();
            $zipFileName = 'Convocations_' . date('Y-m-d_His') . '.zip';
            $zipPath = storage_path('app/temp/' . $zipFileName);

            // Créer le dossier temp s'il n'existe pas
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }

            if ($zip->open($zipPath, \ZipArchive::CREATE) !== TRUE) {
                throw new \Exception('Impossible de créer le fichier ZIP');
            }

            foreach ($request->participant_ids as $participantId) {
                $participant = Participant::with(['campagne.typeAssistance', 'commune'])
                    ->findOrFail($participantId);

                if ($participant->statut === 'Oui') {
                    $pdf = Pdf::loadView('pdf.convocation', [
                        'participant' => $participant
                    ]);
                    
                    $pdf->setPaper('A4', 'portrait');

                    $filename = 'Convocation_' . 
                                $participant->nom . '_' . 
                                $participant->prenom . '.pdf';

                    $zip->addFromString($filename, $pdf->output());
                }
            }

            $zip->close();

            return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error('Erreur génération convocations multiples: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors de la génération des convocations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques des participants par campagne
     */
    public function statistiquesParticipants($campagneId)
    {
        try {
            $participants = Participant::where('campagne_id', $campagneId)->get();

            $stats = [
                'total' => $participants->count(),
                'confirmes' => $participants->where('statut', 'Oui')->count(),
                'refuses' => $participants->where('statut', 'Non')->count(),
                'en_attente' => $participants->where('statut', 'En attente')->count(),
                'appels_effectues' => $participants->where('appel_effectue', true)->count(),
                'appels_non_effectues' => $participants->where('appel_effectue', false)->count(),
                'par_sexe' => [
                    'masculin' => $participants->where('sexe', 'M')->count(),
                    'feminin' => $participants->where('sexe', 'F')->count(),
                ],
                'par_commune' => $participants->groupBy('commune_id')->map(function ($group) {
                    return [
                        'commune' => $group->first()->commune?->nom ?? 'Non spécifiée',
                        'count' => $group->count()
                    ];
                })->values()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur statistiquesParticipants', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Méthode de débogage
     */
    public function debugCanva($campagneId)
    {
        try {
            $fullPath = storage_path('app/' . self::CANVA_FILEPATH);
            
            return response()->json([
                'success' => true,
                'debug' => [
                    'php_version' => PHP_VERSION,
                    'os' => PHP_OS,
                    'storage_path' => storage_path('app'),
                    'canva_filepath' => self::CANVA_FILEPATH,
                    'full_path' => $fullPath,
                    'file_exists' => file_exists($fullPath),
                    'file_size' => file_exists($fullPath) ? filesize($fullPath) : 0,
                    'directory_exists' => is_dir(dirname($fullPath)),
                    'directory_writable' => is_writable(dirname($fullPath)),
                    'directory_readable' => is_readable(dirname($fullPath)),
                    'phpspreadsheet_installed' => class_exists(\PhpOffice\PhpSpreadsheet\Spreadsheet::class),
                    'campagne_id' => $campagneId,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}