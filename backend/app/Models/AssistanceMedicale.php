<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssistanceMedicale extends Model
{
    use HasFactory, SoftDeletes;

    // ⚠️ IMPORTANT : Spécifier le nom correct de la table
    protected $table = 'assistances_medicales';

    protected $fillable = [
        'type_assistance_id',
        'detail_type_assistance_id',
        'beneficiaire_id',
        'nature_don_id',
        'etat_don_id',
        'etat_dossier_id',
        'date_assistance',
        'montant',
        'assistance_pour_moi_meme',
        'observation',
        'duree_utilisation',
        'date_retour_prevue',
        'date_retour_effective',
        'observation_retour',
        'est_retourne',
    ];

    protected $casts = [
        'date_assistance' => 'date',
        'date_retour_prevue' => 'date',
        'date_retour_effective' => 'date',
        'montant' => 'decimal:2',
        'assistance_pour_moi_meme' => 'boolean',
        'est_retourne' => 'boolean',
        'duree_utilisation' => 'integer',
        'type_assistance_id' => 'integer',
        'detail_type_assistance_id' => 'integer',
        'beneficiaire_id' => 'integer',
        'nature_don_id' => 'integer',
        'etat_don_id' => 'integer',
        'etat_dossier_id' => 'integer',
    ];

    protected $attributes = [
        'assistance_pour_moi_meme' => false,
        'est_retourne' => false,
    ];

    // Relations
    public function typeAssistance()
    {
        return $this->belongsTo(TypeAssistance::class, 'type_assistance_id');
    }

    public function detailTypeAssistance()
    {
        return $this->belongsTo(DetailTypeAssistance::class, 'detail_type_assistance_id');
    }

    public function beneficiaire()
    {
        return $this->belongsTo(Beneficiaire::class, 'beneficiaire_id');
    }

    public function natureDon()
    {
        return $this->belongsTo(NatureDon::class, 'nature_don_id');
    }

    public function etatDon()
    {
        return $this->belongsTo(EtatDon::class, 'etat_don_id');
    }

    public function etatDossier()
    {
        return $this->belongsTo(EtatDossier::class, 'etat_dossier_id');
    }
}