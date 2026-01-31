<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convocation - Campagne Médicale UAS</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 8px;
        }
        
        .logo {
            font-size: 14px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 3px;
        }
        
        .title {
            font-size: 12px;
            font-weight: bold;
            color: #2c3e50;
            margin: 5px 0;
        }
        
        .subtitle {
            font-size: 9px;
            color: #7f8c8d;
        }
        
        .content {
            margin: 10px 0;
        }
        
        .campaign-info {
            background-color: #fff3cd;
            border-left: 3px solid #ffc107;
            padding: 8px;
            margin: 10px 0;
            font-size: 8px;
        }
        
        .campaign-title {
            font-weight: bold;
            color: #f57c00;
            margin-bottom: 4px;
            font-size: 10px;
        }
        
        .status-box {
            background-color: #e8f5e8;
            border: 1px solid #27ae60;
            border-radius: 4px;
            padding: 6px;
            text-align: center;
            margin: 10px 0;
        }
        
        .status-text {
            font-size: 10px;
            font-weight: bold;
            color: #27ae60;
        }
        
        .section-title {
            color: #2c3e50;
            margin: 10px 0 6px 0;
            font-size: 9px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            padding-bottom: 2px;
        }
        
        .compact-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 8px;
            border-bottom: 1px dotted #eee;
            padding-bottom: 2px;
        }
        
        .compact-label {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .compact-value {
            color: #34495e;
            text-align: right;
        }
        
        .mini-section {
            margin: 6px 0;
            padding: 6px;
            background-color: #f9f9f9;
            border-radius: 3px;
        }
        
        .reference-number {
            background-color: #e3f2fd;
            border: 1px solid #1976d2;
            border-radius: 3px;
            padding: 3px 6px;
            display: inline-block;
            font-weight: bold;
            color: #1976d2;
            font-size: 9px;
        }
        
        .important-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 3px;
            padding: 6px;
            margin: 10px 0;
            font-size: 8px;
        }
        
        .signature-area {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
        }
        
        .signature-box {
            text-align: center;
            width: 48%;
            font-size: 8px;
        }
        
        .signature-line {
            border-top: 1px solid #333;
            margin-top: 25px;
            padding-top: 3px;
            font-size: 7px;
        }
        
        .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 7px;
            color: #7f8c8d;
            border-top: 1px solid #ddd;
            padding-top: 8px;
        }
        
        .participant-info {
            background-color: #f8f9fa;
            border-left: 3px solid #667eea;
            padding: 8px;
            margin: 10px 0;
        }
        
        .info-title {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 6px;
            font-size: 10px;
        }
        
        .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            margin: 6px 0;
            font-size: 8px;
        }
        
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <!-- En-tête -->
    <div class="header">
        <div class="logo">🏥 DÉLÉGATION DE SANTÉ - SEFROU</div>
        <div class="title">CONVOCATION OFFICIELLE</div>
        <div class="subtitle">Service d'Assistance Sociale (UAS)</div>
    </div>

    <!-- Contenu principal -->
    <div class="content">
        <!-- Informations de la campagne -->
        <div class="campaign-info">
            <div class="campaign-title">{{ $participant->campagne->nom }}</div>
            <div>📅 {{ \Carbon\Carbon::parse($participant->campagne->date_debut)->format('d/m/Y') }} → {{ \Carbon\Carbon::parse($participant->campagne->date_fin)->format('d/m/Y') }}</div>
            <div>📍 {{ $participant->campagne->lieu }}</div>
            @if($participant->campagne->typeAssistance)
            <div style="margin-top: 3px;">
                <strong>Type :</strong> {{ $participant->campagne->typeAssistance->libelle }}
            </div>
            @endif
        </div>

        <!-- Statut de confirmation -->
        <div class="status-box">
            <div class="status-text">✅ CONVOCATION CONFIRMÉE</div>
        </div>

        <!-- Section Participant -->
        <div class="section-title">Participant :</div>
        
        <div class="compact-row">
            <span class="compact-label">Nom :</span>
            <span class="compact-value">{{ $participant->prenom }} {{ $participant->nom }}</span>
        </div>
        
        <div class="compact-row">
            <span class="compact-label">Adresse :</span>
            <span class="compact-value">{{ $participant->adresse }}</span>
        </div>
        
        <div class="compact-row">
            <span class="compact-label">Téléphone :</span>
            <span class="compact-value">{{ $participant->telephone }}</span>
        </div>
        
        @if($participant->email)
        <div class="compact-row">
            <span class="compact-label">Email :</span>
            <span class="compact-value">{{ $participant->email }}</span>
        </div>
        @endif
        
        <!-- Mini section avec détails supplémentaires -->
        <div class="mini-section">
            <div class="compact-row">
                <span class="compact-label">Né le :</span>
                <span class="compact-value">{{ \Carbon\Carbon::parse($participant->date_naissance)->format('d/m/Y') }}</span>
            </div>
            <div class="compact-row">
                <span class="compact-label">CIN :</span>
                <span class="compact-value">{{ $participant->cin }}</span>
            </div>
            @if($participant->commune)
            <div class="compact-row">
                <span class="compact-label">Commune :</span>
                <span class="compact-value">{{ $participant->commune->nom }}</span>
            </div>
            @endif
            @if($participant->date_appel)
            <div class="compact-row">
                <span class="compact-label">Appelé le :</span>
                <span class="compact-value">{{ \Carbon\Carbon::parse($participant->date_appel)->format('d/m/Y à H:i') }}</span>
            </div>
            @endif
        </div>
        
        <!-- Numéro de référence -->
        <div style="text-align: center; margin: 10px 0;">
            <span class="compact-label">N° Réf : </span>
            <span class="reference-number">CONV-{{ str_pad($participant->id, 6, '0', STR_PAD_LEFT) }}/{{ date('Y') }}</span>
        </div>

        @if($participant->campagne->description)
        <!-- Description de la campagne -->
        <div class="participant-info">
            <div class="info-title">📋 Description de la campagne</div>
            <div style="font-size: 8px; line-height: 1.3;">
                {{ $participant->campagne->description }}
            </div>
        </div>
        @endif

        <!-- Instructions importantes -->
        <div class="important-note">
            <strong>⚠️ Instructions importantes :</strong>
            <ul style="margin: 4px 0; padding-left: 15px; font-size: 7.5px;">
                <li>Se présenter <strong>à l'heure</strong> au lieu indiqué</li>
                <li>Munissez-vous de votre <strong>CIN</strong> (Carte d'Identité Nationale)</li>
                <li>Apportez tout <strong>document justificatif</strong> nécessaire</li>
                <li>En cas d'empêchement, <strong>contactez-nous</strong> immédiatement</li>
                <li>Cette convocation est <strong>personnelle et non transmissible</strong></li>
            </ul>
        </div>

        <!-- Section signatures -->
        <div class="signature-area">
            <div class="signature-box">
                <div style="font-weight: bold;">Participant</div>
                <div class="signature-line">
                    Signature
                    <div style="margin-top: 2px; color: #666;">
                        {{ $participant->prenom }} {{ $participant->nom }}
                    </div>
                </div>
            </div>
            <div class="signature-box">
                <div style="font-weight: bold;">Réception UAS</div>
                <div class="signature-line">
                    Signature & cachet
                    <div style="margin-top: 2px; color: #666;">
                        Direction Provinciale
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Pied de page -->
    <div class="footer">
        <div><strong>⚡ Conserver cette convocation</strong> - À présenter obligatoirement le jour J</div>
        <div style="margin-top: 4px;">
            📞 +212 535 XXX XXX | 📧 uas.sefrou@sante.gov.ma | 🕒 {{ date('d/m/Y à H:i') }}
        </div>
    </div>
</body>
</html>