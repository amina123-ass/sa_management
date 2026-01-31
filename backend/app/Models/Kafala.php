<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Kafala extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero_reference',
        'pere_nom',
        'pere_prenom',
        'pere_cin',
        'mere_nom',
        'mere_prenom',
        'mere_cin',
        'date_mariage',
        'telephone',
        'email',
        'adresse',
        'enfant_nom',
        'enfant_prenom',
        'enfant_sexe',
        'enfant_date_naissance',
    ];

    protected $casts = [
        'date_mariage' => 'date',
        'enfant_date_naissance' => 'date',
    ];

    // ✅ hasOne au lieu de hasMany
    public function document()
    {
        return $this->hasOne(KafalaDocument::class);
    }

    // Garder aussi l'ancienne relation pour la compatibilité
    public function documents()
    {
        return $this->hasMany(KafalaDocument::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($kafala) {
            if (empty($kafala->numero_reference)) {
                $kafala->numero_reference = 'KAF-' . date('Y') . '-' . str_pad(static::max('id') + 1, 5, '0', STR_PAD_LEFT);
            }
        });
    }
}