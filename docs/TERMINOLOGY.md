# Player-facing terminology

Use one plain term for each mechanic. Copy should name the person, action, target, number, and lasting effect when those facts matter.

| Use | Meaning | Avoid |
| --- | --- | --- |
| HP | Current health | health points, life |
| Max HP | Maximum HP | maximum health |
| Guard | Damage absorbed before HP | armour, shield points |
| Speed | Turn-order stat | initiative stat |
| Points | Resource spent on techniques | technique points, charge |
| Strain | Pressure that can break Guard | stagger meter, break points |
| Stance | A hero's chosen automatic rule | AI mode, personal policy |
| Team policy | The team's shared automatic rule | formation policy |
| front, middle, or rear slot | A position in the formation | in front, in middle |

## Sentence rules

- Write battle facts as actor, trigger or action, target, then exact result.
- Say a hero starts **in the front slot**. Say equipment is **assigned to the front slot**.
- Capitalize named actions consistently, including **Heavy Hit**, **First Aid**, and **Step In**.
- Keep complete sentences in the main interface. Short labels and stat rows may be fragments.
- Keep seeds, event identifiers, schemas, storage details, and validation language inside optional technical details.
- Author complete candidate descriptions. Do not assemble biographies or rules from adjective and noun fragments.

## Standard patterns

- `{Actor} uses {Action} against {Target}. {Target} loses {amount} HP ({before} to {after}).`
- `{Actor} uses {Stance} when its condition is met. {Effect}; {Actor} spends {cost} Points.`
- `Front slot: {Equipment}. {Hero} starts there with {Guard} Guard and {signed Speed} Speed.`
- `{Hero} was knocked out and starts the next battle Bruised: Max HP {before} to {after}.`
- `{Candidate} is strongest when {mechanical situation}.`

Unknown candidate facts are shown as **Unknown**. The interface never invents an explanation that is not present in typed simulation or content data.
