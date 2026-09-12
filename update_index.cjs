const fs = require('fs');
let code = fs.readFileSync('d:/Projects/CV_Maker/index.html', 'utf8');

// Replace mobile button
code = code.replace(
    '<button class="mobile-nav-btn" id="btn-view-preview" onclick="switchMobileView(\'preview\')">\n      👁️ Aperçu CV\n    </button>',
    '<a class="mobile-nav-btn" id="btn-view-preview" href="preview.html" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; justify-content: center;">\n      👁️ Aperçu CV\n    </a>'
);

// Replace footer utilities
const oldFooter = `      <div class="sidebar-footer">
        <button class="btn-action btn-danger" style="flex: 1; padding: 0.5rem;"
          onclick="resetToDefaults()">Réinitialiser</button>
        <button class="btn-action" style="flex: 1; padding: 0.5rem; background: #3b82f6; color: white;"
          onclick="downloadJSON()">⬇ Exporter</button>
        <button class="btn-action" style="flex: 1; padding: 0.5rem; background: #10b981; color: white;"
          onclick="document.getElementById('import-json-input').click()">⬆ Importer</button>
        <input type="file" id="import-json-input" accept=".json" style="display:none;" onchange="importJSON(this)">
      </div>`;

const newFooter = `      <div class="sidebar-footer" style="flex-wrap: wrap;">
        <a href="preview.html" target="_blank" class="btn-action" style="flex: 1 1 100%; padding: 0.75rem; background: #6366f1; color: white; text-align: center; text-decoration: none; font-weight: bold; font-size: 0.95rem; margin-bottom: 0.5rem;">
          👁️ Ouvrir l'Aperçu (Nouvel Onglet)
        </a>
        <button class="btn-action btn-danger" style="flex: 1; padding: 0.5rem;"
          onclick="resetToDefaults()">Réinitialiser</button>
        <button class="btn-action" style="flex: 1; padding: 0.5rem; background: #3b82f6; color: white;"
          onclick="downloadJSON()">⬇ Exporter</button>
        <button class="btn-action" style="flex: 1; padding: 0.5rem; background: #10b981; color: white;"
          onclick="document.getElementById('import-json-input').click()">⬆ Importer</button>
        <input type="file" id="import-json-input" accept=".json" style="display:none;" onchange="importJSON(this)">
      </div>`;

code = code.replace(oldFooter, newFooter);

// Remove the load tag
code = code.replace('<load src="./src/html/preview.html" />', '');

fs.writeFileSync('d:/Projects/CV_Maker/index.html', code);
console.log('index.html updated successfully');
