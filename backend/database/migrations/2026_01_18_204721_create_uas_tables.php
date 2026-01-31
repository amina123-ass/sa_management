<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Table des campagnes
        Schema::create('campagnes', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->nullable();
            $table->foreignId('type_assistance_id')->nullable()->constrained('type_assistances');
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->string('lieu')->nullable();
            $table->decimal('budget', 12, 2)->nullable();
            $table->integer('nombre_beneficiaires_prevus')->nullable();
            $table->timestamps();
        });

        // Table kafala - CRÉER D'ABORD LA TABLE
        Schema::create('kafalas', function (Blueprint $table) {
            $table->id();
            $table->string('numero_reference')->nullable();
            $table->string('pere_nom')->nullable();
            $table->string('pere_prenom')->nullable();
            $table->string('pere_cin')->nullable();
            $table->string('mere_nom')->nullable();
            $table->string('mere_prenom')->nullable();
            $table->string('mere_cin')->nullable();
            $table->date('date_mariage')->nullable();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->text('adresse')->nullable();
            $table->string('enfant_nom')->nullable();
            $table->string('enfant_prenom')->nullable();
            $table->enum('enfant_sexe', ['M', 'F'])->nullable();
            $table->date('enfant_date_naissance')->nullable();
            $table->timestamps();
        });

        // Table des bénéficiaires
        Schema::create('beneficiaires', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->enum('sexe', ['M', 'F']);
            $table->date('date_naissance');
            $table->string('cin')->unique();
            $table->string('telephone');
            $table->string('email')->nullable();
            $table->text('adresse');
            $table->foreignId('commune_id')->constrained('communes');
            $table->foreignId('type_assistance_id')->constrained('type_assistances');
            $table->boolean('hors_campagne')->default(false);
            $table->foreignId('campagne_id')->nullable()->constrained('campagnes');
            $table->enum('decision', ['Accepté', 'En attente', 'Refusé'])->default('En attente');
            $table->boolean('a_beneficie')->default(false);
            $table->text('observation')->nullable();
            
            // Champs conditionnels pour lunettes
            $table->boolean('enfant_scolarise')->nullable();
            
            // Champs conditionnels pour appareil auditif
            $table->enum('cote', ['Unilatéral', 'Bilatéral'])->nullable();
            
            $table->timestamps();
        });

        // Table documents kafala
        Schema::create('kafala_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kafala_id')->constrained('kafalas')->onDelete('cascade');
            $table->string('nom_fichier');
            $table->string('chemin_fichier');
            $table->string('type_mime');
            $table->bigInteger('taille');
            $table->timestamps();
        });

        // Table assistances médicales
        Schema::create('assistances_medicales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_assistance_id')->constrained('type_assistances')->onDelete('cascade');
            $table->foreignId('detail_type_assistance_id')->nullable()->constrained('detail_type_assistances')->onDelete('set null');
            $table->foreignId('beneficiaire_id')->constrained('beneficiaires')->onDelete('cascade');
            $table->foreignId('nature_don_id')->constrained('nature_dons')->onDelete('cascade');
            $table->foreignId('etat_don_id')->constrained('etat_dons')->onDelete('cascade');
            $table->foreignId('etat_dossier_id')->constrained('etat_dossiers')->onDelete('cascade');
            $table->date('date_assistance');
            $table->decimal('montant', 10, 2)->nullable();
            $table->boolean('assistance_pour_moi_meme')->default(false);
            $table->text('observation')->nullable();
            
            // Pour la gestion des prêts
            $table->integer('duree_utilisation')->nullable()->comment('Durée en jours');
            $table->date('date_retour_prevue')->nullable();
            $table->date('date_retour_effective')->nullable();
            $table->text('observation_retour')->nullable();
            $table->boolean('est_retourne')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistances_medicales');
        Schema::dropIfExists('kafala_documents');
        Schema::dropIfExists('beneficiaires');
        Schema::dropIfExists('kafalas');
        Schema::dropIfExists('campagnes');
    }
};