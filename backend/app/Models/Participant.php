<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Participant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'campagne_id',
        'commune_id',
        'nom',
        'prenom',
        'cin',
        'date_naissance',
        'sexe',
        'telephone',
        'email',
        'adresse',
        'statut',
        'date_appel',
        'appel_effectue',
        'observation_appel',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_appel' => 'date',
        'appel_effectue' => 'boolean',
    ];

    protected $appends = ['age', 'nom_complet'];

    // Relations
    public function campagne()
    {
        return $this->belongsTo(Campagne::class);
    }

    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Accesseurs
    public function getAgeAttribute()
    {
        return $this->date_naissance ? $this->date_naissance->age : null;
    }

    public function getNomCompletAttribute()
    {
        return "{$this->prenom} {$this->nom}";
    }

    // Scopes
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'En attente');
    }

    public function scopeConfirmes($query)
    {
        return $query->where('statut', 'Oui');
    }

    public function scopeRefuses($query)
    {
        return $query->where('statut', 'Non');
    }

    public function scopeNonConfirmes($query)
    {
        return $query->whereIn('statut', ['Non', 'En attente']);
    }

    public function scopeAppelEffectue($query)
    {
        return $query->where('appel_effectue', true);
    }

    public function scopeAppelNonEffectue($query)
    {
        return $query->where('appel_effectue', false);
    }
}