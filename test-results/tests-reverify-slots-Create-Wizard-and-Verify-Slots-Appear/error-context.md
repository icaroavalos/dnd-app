# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/reverify-slots.spec.ts >> Create Wizard and Verify Slots Appear
- Location: tests/reverify-slots.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - button "Menu de fichas" [ref=e5] [cursor=pointer]:
      - img [ref=e6]
    - strong [ref=e7]: Slot-Fix-Tester
    - generic [ref=e9]: salvo
  - main [ref=e11]:
    - complementary [ref=e12]:
      - heading "Construtor de Personagem" [level=1] [ref=e14]
      - generic [ref=e16]:
        - navigation [ref=e17]:
          - button "1. Linhagem" [ref=e18] [cursor=pointer]
          - button "2. Classe" [ref=e19] [cursor=pointer]
          - button "3. Magias" [ref=e20] [cursor=pointer]
          - button "4. Origem" [ref=e21] [cursor=pointer]
          - button "5. Atributos" [ref=e22] [cursor=pointer]
        - generic [ref=e25]:
          - heading "Magias de Wizard" [level=2] [ref=e26]
          - generic [ref=e27]:
            - img [ref=e28]
            - textbox "Buscar magias..." [ref=e31]
          - generic [ref=e32]:
            - generic [ref=e33]:
              - generic [ref=e34]:
                - heading "Truques (Cantrips)" [level=3] [ref=e35]:
                  - img [ref=e36]
                  - text: Truques (Cantrips)
                - generic [ref=e39]: 3 / 3
              - generic [ref=e40]:
                - generic [ref=e41] [cursor=pointer]:
                  - checkbox [ref=e43]
                  - generic [ref=e44]:
                    - generic [ref=e45]: Acid Splash
                    - generic [ref=e46]: V
                - generic [ref=e47] [cursor=pointer]:
                  - checkbox [ref=e49]
                  - generic [ref=e50]:
                    - generic [ref=e51]: Blade Ward
                    - generic [ref=e52]: A
                - generic [ref=e53] [cursor=pointer]:
                  - checkbox [ref=e55]
                  - generic [ref=e56]:
                    - generic [ref=e57]: Chill Touch
                    - generic [ref=e58]: "N"
                - generic [ref=e59] [cursor=pointer]:
                  - checkbox [ref=e61]
                  - generic [ref=e62]:
                    - generic [ref=e63]: Dancing Lights
                    - generic [ref=e64]: I
                - generic [ref=e65] [cursor=pointer]:
                  - checkbox [ref=e67]
                  - generic [ref=e68]:
                    - generic [ref=e69]: Elementalism
                    - generic [ref=e70]: T
                - generic [ref=e71] [cursor=pointer]:
                  - checkbox [ref=e73]
                  - generic [ref=e74]:
                    - generic [ref=e75]: Fire Bolt
                    - generic [ref=e76]: V
                - generic [ref=e77] [cursor=pointer]:
                  - checkbox [ref=e79]
                  - generic [ref=e80]:
                    - generic [ref=e81]: Friends
                    - generic [ref=e82]: E
                - generic [ref=e83] [cursor=pointer]:
                  - checkbox [checked] [ref=e85]
                  - generic [ref=e86]:
                    - generic [ref=e87]: Light
                    - generic [ref=e88]: V
                - generic [ref=e89] [cursor=pointer]:
                  - checkbox [checked] [ref=e91]
                  - generic [ref=e92]:
                    - generic [ref=e93]: Mage Hand
                    - generic [ref=e94]: C
                - generic [ref=e95] [cursor=pointer]:
                  - checkbox [ref=e97]
                  - generic [ref=e98]:
                    - generic [ref=e99]: Mending
                    - generic [ref=e100]: T
                - generic [ref=e101] [cursor=pointer]:
                  - checkbox [ref=e103]
                  - generic [ref=e104]:
                    - generic [ref=e105]: Message
                    - generic [ref=e106]: T
                - generic [ref=e107] [cursor=pointer]:
                  - checkbox [ref=e109]
                  - generic [ref=e110]:
                    - generic [ref=e111]: Mind Sliver
                    - generic [ref=e112]: E
                - generic [ref=e113] [cursor=pointer]:
                  - checkbox [ref=e115]
                  - generic [ref=e116]:
                    - generic [ref=e117]: Minor Illusion
                    - generic [ref=e118]: I
                - generic [ref=e119] [cursor=pointer]:
                  - checkbox [ref=e121]
                  - generic [ref=e122]:
                    - generic [ref=e123]: Poison Spray
                    - generic [ref=e124]: "N"
                - generic [ref=e125] [cursor=pointer]:
                  - checkbox [ref=e127]
                  - generic [ref=e128]:
                    - generic [ref=e129]: Prestidigitation
                    - generic [ref=e130]: T
                - generic [ref=e131] [cursor=pointer]:
                  - checkbox [checked] [ref=e133]
                  - generic [ref=e134]:
                    - generic [ref=e135]: Ray of Frost
                    - generic [ref=e136]: V
                - generic [ref=e137] [cursor=pointer]:
                  - checkbox [ref=e139]
                  - generic [ref=e140]:
                    - generic [ref=e141]: Shocking Grasp
                    - generic [ref=e142]: V
                - generic [ref=e143] [cursor=pointer]:
                  - checkbox [ref=e145]
                  - generic [ref=e146]:
                    - generic [ref=e147]: Thunderclap
                    - generic [ref=e148]: V
                - generic [ref=e149] [cursor=pointer]:
                  - checkbox [ref=e151]
                  - generic [ref=e152]:
                    - generic [ref=e153]: Toll the Dead
                    - generic [ref=e154]: "N"
                - generic [ref=e155] [cursor=pointer]:
                  - checkbox [ref=e157]
                  - generic [ref=e158]:
                    - generic [ref=e159]: True Strike
                    - generic [ref=e160]: D
            - generic [ref=e161]:
              - generic [ref=e162]:
                - heading "Magias de Nível 1 (Livro de Magias)" [level=3] [ref=e163]:
                  - img [ref=e164]
                  - text: Magias de Nível 1 (Livro de Magias)
                - generic [ref=e167]: 7 / 6
              - generic [ref=e168]:
                - generic [ref=e169] [cursor=pointer]:
                  - checkbox [ref=e171]
                  - generic [ref=e172]:
                    - generic [ref=e173]: Alarm
                    - generic [ref=e174]: A
                - generic [ref=e175] [cursor=pointer]:
                  - checkbox [ref=e177]
                  - generic [ref=e178]:
                    - generic [ref=e179]: Burning Hands
                    - generic [ref=e180]: V
                - generic [ref=e181] [cursor=pointer]:
                  - checkbox [ref=e183]
                  - generic [ref=e184]:
                    - generic [ref=e185]: Charm Person
                    - generic [ref=e186]: E
                - generic [ref=e187] [cursor=pointer]:
                  - checkbox [ref=e189]
                  - generic [ref=e190]:
                    - generic [ref=e191]: Chromatic Orb
                    - generic [ref=e192]: V
                - generic [ref=e193] [cursor=pointer]:
                  - checkbox [ref=e195]
                  - generic [ref=e196]:
                    - generic [ref=e197]: Color Spray
                    - generic [ref=e198]: I
                - generic [ref=e199] [cursor=pointer]:
                  - checkbox [ref=e201]
                  - generic [ref=e202]:
                    - generic [ref=e203]: Comprehend Languages
                    - generic [ref=e204]: D
                - generic [ref=e205] [cursor=pointer]:
                  - checkbox [checked] [ref=e207]
                  - generic [ref=e208]:
                    - generic [ref=e209]: Detect Magic
                    - generic [ref=e210]: D
                - generic [ref=e211] [cursor=pointer]:
                  - checkbox [ref=e213]
                  - generic [ref=e214]:
                    - generic [ref=e215]: Disguise Self
                    - generic [ref=e216]: I
                - generic [ref=e217] [cursor=pointer]:
                  - checkbox [ref=e219]
                  - generic [ref=e220]:
                    - generic [ref=e221]: Expeditious Retreat
                    - generic [ref=e222]: T
                - generic [ref=e223] [cursor=pointer]:
                  - checkbox [ref=e225]
                  - generic [ref=e226]:
                    - generic [ref=e227]: False Life
                    - generic [ref=e228]: "N"
                - generic [ref=e229] [cursor=pointer]:
                  - checkbox [checked] [ref=e231]
                  - generic [ref=e232]:
                    - generic [ref=e233]: Feather Fall
                    - generic [ref=e234]: T
                - generic [ref=e235] [cursor=pointer]:
                  - checkbox [ref=e237]
                  - generic [ref=e238]:
                    - generic [ref=e239]: Find Familiar
                    - generic [ref=e240]: C
                - generic [ref=e241] [cursor=pointer]:
                  - checkbox [ref=e243]
                  - generic [ref=e244]:
                    - generic [ref=e245]: Fog Cloud
                    - generic [ref=e246]: C
                - generic [ref=e247] [cursor=pointer]:
                  - checkbox [ref=e249]
                  - generic [ref=e250]:
                    - generic [ref=e251]: Grease
                    - generic [ref=e252]: C
                - generic [ref=e253] [cursor=pointer]:
                  - checkbox [ref=e255]
                  - generic [ref=e256]:
                    - generic [ref=e257]: Ice Knife
                    - generic [ref=e258]: C
                - generic [ref=e259] [cursor=pointer]:
                  - checkbox [checked] [ref=e261]
                  - generic [ref=e262]:
                    - generic [ref=e263]: Identify
                    - generic [ref=e264]: D
                - generic [ref=e265] [cursor=pointer]:
                  - checkbox [ref=e267]
                  - generic [ref=e268]:
                    - generic [ref=e269]: Illusory Script
                    - generic [ref=e270]: I
                - generic [ref=e271] [cursor=pointer]:
                  - checkbox [ref=e273]
                  - generic [ref=e274]:
                    - generic [ref=e275]: Jump
                    - generic [ref=e276]: T
                - generic [ref=e277] [cursor=pointer]:
                  - checkbox [ref=e279]
                  - generic [ref=e280]:
                    - generic [ref=e281]: Longstrider
                    - generic [ref=e282]: T
                - generic [ref=e283] [cursor=pointer]:
                  - checkbox [checked] [ref=e285]
                  - generic [ref=e286]:
                    - generic [ref=e287]: Mage Armor
                    - generic [ref=e288]: A
                - generic [ref=e289] [cursor=pointer]:
                  - checkbox [checked] [ref=e291]
                  - generic [ref=e292]:
                    - generic [ref=e293]: Magic Missile
                    - generic [ref=e294]: V
                - generic [ref=e295] [cursor=pointer]:
                  - checkbox [ref=e297]
                  - generic [ref=e298]:
                    - generic [ref=e299]: Protection from Evil and Good
                    - generic [ref=e300]: A
                - generic [ref=e301] [cursor=pointer]:
                  - checkbox [ref=e303]
                  - generic [ref=e304]:
                    - generic [ref=e305]: Ray of Sickness
                    - generic [ref=e306]: "N"
                - generic [ref=e307] [cursor=pointer]:
                  - checkbox [ref=e309]
                  - generic [ref=e310]:
                    - generic [ref=e311]: Shield
                    - generic [ref=e312]: A
                - generic [ref=e313] [cursor=pointer]:
                  - checkbox [ref=e315]
                  - generic [ref=e316]:
                    - generic [ref=e317]: Silent Image
                    - generic [ref=e318]: I
                - generic [ref=e319] [cursor=pointer]:
                  - checkbox [checked] [ref=e321]
                  - generic [ref=e322]:
                    - generic [ref=e323]: Sleep
                    - generic [ref=e324]: E
                - generic [ref=e325] [cursor=pointer]:
                  - checkbox [ref=e327]
                  - generic [ref=e328]:
                    - generic [ref=e329]: Tasha's Hideous Laughter
                    - generic [ref=e330]: E
                - generic [ref=e331] [cursor=pointer]:
                  - checkbox [ref=e333]
                  - generic [ref=e334]:
                    - generic [ref=e335]: Tenser's Floating Disk
                    - generic [ref=e336]: C
                - generic [ref=e337] [cursor=pointer]:
                  - checkbox [checked] [ref=e339]
                  - generic [ref=e340]:
                    - generic [ref=e341]: Thunderwave
                    - generic [ref=e342]: V
                - generic [ref=e343] [cursor=pointer]:
                  - checkbox [ref=e345]
                  - generic [ref=e346]:
                    - generic [ref=e347]: Unseen Servant
                    - generic [ref=e348]: C
                - generic [ref=e349] [cursor=pointer]:
                  - checkbox [ref=e351]
                  - generic [ref=e352]:
                    - generic [ref=e353]: Witch Bolt
                    - generic [ref=e354]: V
        - generic [ref=e355]:
          - button "Anterior" [ref=e356] [cursor=pointer]
          - button "Próximo" [active] [ref=e357] [cursor=pointer]
    - generic [ref=e360]:
      - generic [ref=e361]:
        - button "Resumo" [ref=e362] [cursor=pointer]
        - button "Perícias" [ref=e363] [cursor=pointer]
        - button "Itens" [ref=e364] [cursor=pointer]
        - button "Ações" [ref=e365] [cursor=pointer]
        - button "Magias" [ref=e366] [cursor=pointer]
        - button "Habilidades" [ref=e367] [cursor=pointer]
      - generic [ref=e369]:
        - generic [ref=e370]:
          - button "LEVEL UP" [ref=e371] [cursor=pointer]:
            - img [ref=e372]
            - text: LEVEL UP
          - generic [ref=e374]:
            - button "Short Rest" [ref=e375] [cursor=pointer]:
              - img [ref=e376]
              - text: Short Rest
            - button "Long Rest" [ref=e378] [cursor=pointer]:
              - img [ref=e379]
              - text: Long Rest
        - generic [ref=e381]:
          - generic [ref=e382]: Slot-Fix-Tester
          - generic [ref=e383]: Wizard 1
        - generic [ref=e384]:
          - generic [ref=e385]:
            - generic [ref=e386]:
              - generic [ref=e387]: Iniciativa
              - strong [ref=e389]: "+0"
            - generic [ref=e390]:
              - generic [ref=e391]: HP
              - strong [ref=e392]:
                - text: "0"
                - generic [ref=e393]: 0/10
              - generic [ref=e394]: Bloodied
            - generic [ref=e395]:
              - generic [ref=e396]: Speed
              - strong [ref=e398]: "30"
          - generic [ref=e399]:
            - generic [ref=e400]:
              - button [ref=e401] [cursor=pointer]:
                - img [ref=e402]
              - spinbutton [ref=e403]
              - button [ref=e404] [cursor=pointer]:
                - img [ref=e405]
            - generic [ref=e406]:
              - button "Damage" [ref=e407] [cursor=pointer]
              - button "Heal" [ref=e408] [cursor=pointer]
              - button "Temp HP" [ref=e409] [cursor=pointer]
          - generic [ref=e410]:
            - generic [ref=e412]: Hit Dice
            - button "Spend Hit Die" [ref=e415] [cursor=pointer]
        - generic [ref=e416]:
          - generic [ref=e417]:
            - generic [ref=e418]: Armor Class
            - strong [ref=e419]: "10"
          - generic [ref=e420]:
            - generic [ref=e421]: Proficiency
            - strong [ref=e422]: "+2"
          - generic [ref=e423]:
            - generic [ref=e424]: Save DC
            - strong [ref=e425]: "10"
        - generic [ref=e426]:
          - article [ref=e427]:
            - heading "STR" [level=3] [ref=e428]
            - generic [ref=e429]:
              - generic [ref=e430]:
                - generic [ref=e431]: Score
                - strong [ref=e432]: "10"
              - generic [ref=e433]:
                - generic [ref=e434]: Mod
                - strong [ref=e435]: "+0"
              - generic [ref=e436]:
                - generic [ref=e437]: Save
                - strong [ref=e438]: "+0"
          - article [ref=e439]:
            - heading "DEX" [level=3] [ref=e440]
            - generic [ref=e441]:
              - generic [ref=e442]:
                - generic [ref=e443]: Score
                - strong [ref=e444]: "10"
              - generic [ref=e445]:
                - generic [ref=e446]: Mod
                - strong [ref=e447]: "+0"
              - generic [ref=e448]:
                - generic [ref=e449]: Save
                - strong [ref=e450]: "+0"
          - article [ref=e451]:
            - heading "CON" [level=3] [ref=e452]
            - generic [ref=e453]:
              - generic [ref=e454]:
                - generic [ref=e455]: Score
                - strong [ref=e456]: "10"
              - generic [ref=e457]:
                - generic [ref=e458]: Mod
                - strong [ref=e459]: "+0"
              - generic [ref=e460]:
                - generic [ref=e461]: Save
                - strong [ref=e462]: "+0"
          - article [ref=e463]:
            - heading "INT" [level=3] [ref=e464]
            - generic [ref=e465]:
              - generic [ref=e466]:
                - generic [ref=e467]: Score
                - strong [ref=e468]: "10"
              - generic [ref=e469]:
                - generic [ref=e470]: Mod
                - strong [ref=e471]: "+0"
              - generic [ref=e472]:
                - generic [ref=e473]: Save
                - strong [ref=e474]: "+0"
          - article [ref=e475]:
            - heading "WIS" [level=3] [ref=e476]
            - generic [ref=e477]:
              - generic [ref=e478]:
                - generic [ref=e479]: Score
                - strong [ref=e480]: "10"
              - generic [ref=e481]:
                - generic [ref=e482]: Mod
                - strong [ref=e483]: "+0"
              - generic [ref=e484]:
                - generic [ref=e485]: Save
                - strong [ref=e486]: "+0"
          - article [ref=e487]:
            - heading "CHA" [level=3] [ref=e488]
            - generic [ref=e489]:
              - generic [ref=e490]:
                - generic [ref=e491]: Score
                - strong [ref=e492]: "10"
              - generic [ref=e493]:
                - generic [ref=e494]: Mod
                - strong [ref=e495]: "+0"
              - generic [ref=e496]:
                - generic [ref=e497]: Save
                - strong [ref=e498]: "+0"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Create Wizard and Verify Slots Appear', async ({ page }) => {
  4  |   await page.goto('http://localhost:3000/creator');
  5  |   await page.getByLabel('Nome da ficha').fill('Slot-Fix-Tester');
  6  |   await page.getByLabel('Espécie (Species)').selectOption({ label: 'Elf' });
  7  |   await page.getByRole('button', { name: 'Próximo' }).click();
  8  |   await page.getByLabel('Classe').selectOption({ label: 'Wizard' });
  9  |   await page.getByRole('button', { name: 'Próximo' }).click();
> 10 |   await page.locator('select').nth(0).selectOption({ label: 'Sage' });
     |                                       ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  11 |   await page.getByRole('button', { name: '+2 / +1' }).click();
  12 |   await page.locator('button:has-text("INT")').first().click();
  13 |   await page.locator('button:has-text("SAB")').first().click();
  14 |   await page.getByTestId('equipment-option-A').click();
  15 |   await page.getByRole('button', { name: 'Próximo' }).click();
  16 |   await page.waitForTimeout(1000);
  17 |   await page.getByText('Fire Bolt').first().click();
  18 |   await page.getByText('Magic Missile').first().click();
  19 |   await page.getByRole('button', { name: 'Próximo' }).click();
  20 |   await page.getByLabel('Método de Geração').selectOption('standard');
  21 |   await page.getByRole('button', { name: 'Finalizar' }).click();
  22 |   await expect(page).toHaveURL(/.*sheet/);
  23 |   await page.getByRole('button', { name: 'MAGIAS' }).click();
  24 |   await page.waitForTimeout(1000);
  25 |   
  26 |   // Verify squares (slots) are present
  27 |   const squares = page.locator('button[aria-label^="Slot"]');
  28 |   const count = await squares.count();
  29 |   console.log('Number of slot squares found:', count);
  30 |   expect(count).toBeGreaterThan(0);
  31 |   
  32 |   await page.screenshot({ path: 'test-snapshots/slots-found.png' });
  33 | });
  34 | 
```