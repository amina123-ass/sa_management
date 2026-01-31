<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class TestCanvaGeneration extends Command
{
    protected $signature = 'test:canva';
    protected $description = 'Tester la génération du fichier Canva';

    public function handle()
    {
        $this->info('=== TEST DE GÉNÉRATION DU FICHIER CANVA ===');
        $this->newLine();

        try {
            // 1. Vérifier que PhpSpreadsheet est disponible
            $this->info('1. Vérification de PhpSpreadsheet...');
            if (!class_exists(Spreadsheet::class)) {
                $this->error('   ✗ PhpSpreadsheet non installé!');
                $this->info('   Exécutez: composer require phpoffice/phpspreadsheet');
                return 1;
            }
            $this->info('   ✓ PhpSpreadsheet OK');
            $this->newLine();

            // 2. Vérifier le dossier storage
            $this->info('2. Vérification du dossier storage...');
            $storagePath = storage_path('app/participants');
            $this->info('   Chemin: ' . $storagePath);
            
            if (!is_dir($storagePath)) {
                $this->warn('   ! Dossier n\'existe pas, création...');
                mkdir($storagePath, 0755, true);
            }
            $this->info('   ✓ Dossier existe');
            
            if (!is_writable($storagePath)) {
                $this->error('   ✗ Dossier non accessible en écriture!');
                return 1;
            }
            $this->info('   ✓ Dossier accessible en écriture');
            $this->newLine();

            // 3. Créer un fichier Excel de test
            $this->info('3. Création du fichier Excel de test...');
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // En-têtes
            $headers = ['CIN', 'Nom', 'Prénom', 'Date naissance', 'Sexe', 'Téléphone', 
                       'Email', 'Adresse', 'Commune', 'Statut', 'Date appel', 'Observation'];
            
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFE0E0E0');
                $col++;
            }

            // Données de test
            $testData = [
                ['AB123456', 'Alami', 'Mohammed', '1990-01-15', 'M', '0612345678', 
                 'test@example.com', '123 Rue Test', 'Casablanca', 'En attente', '', ''],
                ['CD789012', 'Bennani', 'Fatima', '1985-05-20', 'F', '0698765432', 
                 'test2@example.com', '456 Av Test', 'Rabat', 'En attente', '', ''],
                ['EF345678', 'Tazi', 'Ahmed', '1995-12-10', 'M', '0656781234', 
                 'test3@example.com', '789 Bd Test', 'Fès', 'En attente', '', '']
            ];

            $row = 2;
            foreach ($testData as $data) {
                $col = 'A';
                foreach ($data as $value) {
                    $sheet->setCellValue($col . $row, $value);
                    $col++;
                }
                $row++;
            }

            // Auto-size colonnes
            foreach (range('A', 'L') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $this->info('   ✓ Fichier Excel créé en mémoire');
            $this->newLine();

            // 4. MÉTHODE 1 : Avec Storage::put()
            $this->info('4. Test MÉTHODE 1 : Storage::put()...');
            try {
                $writer = new Xlsx($spreadsheet);
                $tempFile = tempnam(sys_get_temp_dir(), 'canva_test_');
                $writer->save($tempFile);
                
                $fileContent = file_get_contents($tempFile);
                $saved = Storage::put('participants/test_storage_put.xlsx', $fileContent);
                unlink($tempFile);
                
                if ($saved) {
                    $filePath = Storage::path('participants/test_storage_put.xlsx');
                    $fileSize = Storage::size('participants/test_storage_put.xlsx');
                    $this->info('   ✓ Fichier sauvegardé avec Storage::put()');
                    $this->info('   Chemin: ' . $filePath);
                    $this->info('   Taille: ' . number_format($fileSize) . ' bytes');
                } else {
                    $this->error('   ✗ Échec Storage::put()');
                }
            } catch (\Exception $e) {
                $this->error('   ✗ Erreur: ' . $e->getMessage());
            }
            $this->newLine();

            // 5. MÉTHODE 2 : Sauvegarde directe
            $this->info('5. Test MÉTHODE 2 : Sauvegarde directe...');
            try {
                $fullPath = storage_path('app/participants/test_direct.xlsx');
                $writer = new Xlsx($spreadsheet);
                $writer->save($fullPath);
                
                if (file_exists($fullPath)) {
                    $fileSize = filesize($fullPath);
                    $this->info('   ✓ Fichier sauvegardé directement');
                    $this->info('   Chemin: ' . $fullPath);
                    $this->info('   Taille: ' . number_format($fileSize) . ' bytes');
                } else {
                    $this->error('   ✗ Fichier non créé');
                }
            } catch (\Exception $e) {
                $this->error('   ✗ Erreur: ' . $e->getMessage());
            }
            $this->newLine();

            // 6. Récapitulatif
            $this->info('6. Récapitulatif des fichiers dans storage/app/participants:');
            $files = Storage::files('participants');
            if (count($files) > 0) {
                foreach ($files as $file) {
                    $size = Storage::size($file);
                    $this->info('   - ' . basename($file) . ' (' . number_format($size) . ' bytes)');
                }
            } else {
                $this->warn('   Aucun fichier trouvé');
            }
            $this->newLine();

            $this->info('=== TEST TERMINÉ AVEC SUCCÈS ===');
            
            return 0;

        } catch (\Exception $e) {
            $this->error('=== ERREUR GÉNÉRALE ===');
            $this->error('Message: ' . $e->getMessage());
            $this->error('Fichier: ' . $e->getFile());
            $this->error('Ligne: ' . $e->getLine());
            $this->newLine();
            $this->error('Trace:');
            $this->error($e->getTraceAsString());
            
            return 1;
        }
    }
}