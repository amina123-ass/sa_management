<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Campagne extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'type_assistance_id',
        'date_debut',
        'date_fin',
        'lieu',
        'budget',
        'nombre_beneficiaires_prevus',
        'description',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'budget' => 'decimal:2',
    ];

    protected $appends = ['statut'];

    public function typeAssistance()
{
    return $this->belongsTo(TypeAssistance::class, 'type_assistance_id');
}

    public function beneficiaires()
    {
        return $this->hasMany(Beneficiaire::class);
    }

    public function getStatutAttribute()
    {
        $now = Carbon::now();
        $debut = Carbon::parse($this->date_debut);
        $fin = Carbon::parse($this->date_fin);

        if ($now->lt($debut)) {
            return 'À venir';
        } elseif ($now->between($debut, $fin)) {
            return 'En cours';
        } else {
            return 'Terminée';
        }
    }
}