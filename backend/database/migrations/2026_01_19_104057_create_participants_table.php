<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campagne_id')->constrained('campagnes')->onDelete('cascade');
            $table->foreignId('commune_id')->nullable()->constrained('communes')->onDelete('set null');
            
            // Informations personnelles
            $table->string('nom');
            $table->string('prenom');
            $table->string('cin')->unique();
            $table->date('date_naissance');
            $table->enum('sexe', ['M', 'F']);
            $table->string('telephone');
            $table->string('email')->nullable();
            $table->text('adresse');
            
            // Gestion des appels
            $table->enum('statut', ['En attente', 'Oui', 'Non'])->default('En attente');
            $table->date('date_appel')->nullable();
            $table->boolean('appel_effectue')->default(false);
            $table->text('observation_appel')->nullable();
            
            // Métadonnées
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Index
            $table->index(['campagne_id', 'statut']);
            $table->index('date_appel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};