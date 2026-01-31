<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Beneficiaire extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'sexe',
        'date_naissance',
        'cin',
        'telephone',
        'email',
        'adresse',
        'commune_id',
        'type_assistance_id',
        'hors_campagne',
        'campagne_id',
        'decision',
        'a_beneficie',
        'observation',
        'enfant_scolarise',
        'cote',
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'hors_campagne' => 'boolean',
        'a_beneficie' => 'boolean',
        'enfant_scolarise' => 'boolean',
    ];

    protected $appends = ['age', 'full_name'];

    public function commune()
    {
        return $this->belongsTo(Commune::class);
    }

    public function typeAssistance()
    {
        return $this->belongsTo(TypeAssistance::class);
    }

    public function campagne()
    {
        return $this->belongsTo(Campagne::class);
    }

    public function assistancesMedicales()
    {
        return $this->hasMany(AssistanceMedicale::class);
    }

    public function getAgeAttribute()
    {
        return Carbon::parse($this->date_naissance)->age;
    }

    public function getFullNameAttribute()
    {
        return "{$this->prenom} {$this->nom}";
    }

    public function getTrancheAgeAttribute()
    {
        $age = $this->age;
        if ($age < 15) {
            return 'Moins de 15 ans';
        } elseif ($age >= 15 && $age <= 64) {
            return 'Entre 15 et 64 ans';
        } else {
            return 'Plus de 64 ans';
        }
    }
}